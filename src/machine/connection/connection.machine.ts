import { createMachine, type ActorRef, type MachineConfig } from 'xstate'

import type { ConnectionEvents } from './connection.events'

import actions from './connection.actions'
import guards from './connection.guards'
import services from './connection.services'
import type { SignalingEvents } from '../signaling/signaling.events'
import { PeerConnectionEventType } from '../peer-connection/peer-connection.events'

export type ConnectionContext = {
    // The URL of the matchmaking server
    // Accessed via HTTPS
    matchmakingUrl: URL
    signalingUrl: URL
    signalingMachine?: ActorRef<SignalingEvents>
}

export interface ConnectionStateSchema {
    states: {
        matchmaking: {
            states: {
                query: {}
                validate: {}
            }
        }
        signaling: {}
        done: {}
        error: {}
    }
}

const connectionMachineConfig = (
    matchmakingUrl: URL,
    signalingUrl: URL
): MachineConfig<
    ConnectionContext,
    ConnectionStateSchema,
    ConnectionEvents
> => ({
    schema: {
        context: {} as ConnectionContext,
        events: {} as ConnectionEvents,
    },

    context: {
        matchmakingUrl,
        signalingUrl,
        signalingMachine: undefined,
    },

    initial: 'matchmaking',
    states: {
        // query the matchmaking server for the id of an unrealMachine and the peerConnectionParameters
        matchmaking: {
            initial: 'query',
            states: {
                query: {
                    invoke: {
                        src: 'queryMatchmaker',
                        onDone: { target: 'validate' },
                        onError: { target: 'error' },
                    },
                },

                // we have to make sure that our response isn't a 'matchmaking_no_instance'
                validate: {
                    entry: (_c, event) =>
                        console.log('validate matchmaking response', event),
                    always: [
                        {
                            target: 'signaling',
                            cond: 'matchmakingOk',
                        },
                        { target: 'error' },
                    ],
                },
            },
        },

        // once we have an unreal-id, we can start signaling
        signaling: {
            entry: 'spawnSignalingMachine',
            on: {
                [PeerConnectionEventType.Track]: { actions: 'sendToParent' },
                [PeerConnectionEventType.Connections]: {
                    actions: 'sendToParent',
                },
            },
        },

        done: {
            entry: [() => console.info('connected'), 'sendConnectionsToParent'],
            type: 'final',
        },

        error: {
            entry: 'sendErrorToParent',
            type: 'final',
        },
    },
})

export const makeConnectionMachine = (
    matchmakingUrl: URL,
    signalingUrl: URL
) => {
    const configuration = connectionMachineConfig(matchmakingUrl, signalingUrl)
    return createMachine<ConnectionContext, ConnectionEvents>(configuration, {
        services,
        guards,
        actions,
    })
}
