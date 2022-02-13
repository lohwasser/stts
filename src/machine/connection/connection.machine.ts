import { createMachine, type ActorRef, type MachineConfig } from 'xstate'

import type { ConnectionEvents } from './connection.events'
import type { SignalingEvents } from '../signaling/signaling.events'

import actions from './connection.actions'
import guards from './connection.guards'
import services from './connection.services'

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
        // ice: {}
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
                signaling_configuration: {},
                signaling_ice_candidate: {},
                signaling_offer: {},
            },
        },

        // // 'Interactive Connectivity Establishment' protocol
        // // https://en.wikipedia.org/wiki/Interactive_Connectivity_Establishment
        // ice: {
        //     entry: 'spawnICEMachine',
        //     on: {
        //         'ice_track': { actions: 'relayToParent' },
        //         'ice_connections': { actions: 'relayToParent' },

        //         // video_loaded_metadata: {
        //         //   actions: "setVideoMetadata",
        //         //   target: "ready",
        //         // },

        //         // ignore these
        //         // video_loaded_metadata: {},
        //         // "done.invoke.ice": {},

        //         '*': {
        //             actions: (c, event) =>
        //                 console.log('PIXEL ICE EVENT', event),
        //         },
        //     },
        // },

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
