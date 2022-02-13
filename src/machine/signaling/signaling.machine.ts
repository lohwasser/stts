import type { WebSocketClientEvents } from 'fsm/src/machines/websocket-client/websocket-client.events'
import { createMachine, type MachineConfig, type ActorRef } from 'xstate'
import {
    SignalingEventType,
    type IceEvents,
    type SignalingEvents,
} from './signaling.events'

import actions from './signaling.actions'
import type { UnrealMachineId } from 'src/domain/unreal'
import type { PeerConnectionEvents } from '../peer-connection/peer-connection.events'
import { IceEventType } from 'src/domain/ice.events'

export type SignalingContext = {
    url: URL
    unrealId: UnrealMachineId
    rtcConfiguration: RTCConfiguration
    websocketMachine?: ActorRef<WebSocketClientEvents>
    peerConnectionMachine?: ActorRef<PeerConnectionEvents>
}

export interface SignalingStateSchema {
    states: {
        init: {}

        websocket: {}

        peerConnection: {}

        // after the connection has been established, we're done
        done: {}

        // something went wrong
        error: {}
    }
}

const machineConfig = ({
    url,
    unrealId,
    rtcConfiguration,
}: SignalingMachineConfiguration): MachineConfig<
    SignalingContext,
    SignalingStateSchema,
    SignalingEvents
> => ({
    id: 'websocket-client',
    schema: {
        context: {} as SignalingContext,
        events: {} as SignalingEvents,
    },
    context: {
        url,
        unrealId,
        rtcConfiguration,
        websocketMachine: undefined,
        peerConnectionMachine: undefined,
    },
    initial: 'init',
    states: {
        init: {
            // Open the websocket connection to the signaling-server
            // Note: although we actually use (ie. send any data over)
            // the websocket only during the signalling-stage, we cannot discard
            // the connection, because it also acts as an indicator to the
            // signaling server that we (the player) are still there.
            entry: 'spawnWebsocketMachine',
            on: {
                ws_client_open: { target: 'ok' },
                ws_client_error: { target: 'error' },
            },
        },

        websocket: {
            // send a start request to the signaling server
            // we're expecting a Signaling.Configuration message in response
            entry: 'startSignaling',
            on: {
                // received via a parsed websocket-message
                [SignalingEventType.Configuration]: {
                    actions: 'spawnPeerConnectionMachine',
                    target: 'peerConnection',
                },
            },
        },

        peerConnection: {
            on: {
                // The first thing the peer connection does is create an RTCSessionDescription 'offer'
                // which is
                //  1. set as the 'local-description' inside the peer connection
                //  2. Forwarded to the signaling server (websocket)  ←  'you are here'
                [SignalingEventType.Offer]: {
                    actions: 'sendViaWebSocket',
                },

                // When we're receiving an ice candidate from the peer connection,
                // forward it to the websocket
                // * Iff we also receive ice-candidates fromm the websocket, we have to rethink this
                [IceEventType.Candidate]: {
                    actions: 'sendViaWebSocket',
                },
            },
        },

        done: {},
        error: {
            id: 'error',
            type: 'final',
        },
    },

    on: {
        '*': {
            actions: (_c, event) =>
                console.warn('Unexpected Websocket event:', { event }),
        },
    },
})

export const makeSignalingMachine = (config: SignalingMachineConfiguration) =>
    createMachine<SignalingContext, SignalingEvents>(machineConfig(config), {
        actions,
    })

export type SignalingMachineConfiguration = {
    url: URL
    unrealId: UnrealMachineId
    rtcConfiguration: RTCConfiguration
}
