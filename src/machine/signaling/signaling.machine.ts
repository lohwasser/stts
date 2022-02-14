import { createMachine, type MachineConfig, type ActorRef } from 'xstate'

import {
    WebSocketClientReplyType,
    type WebSocketClientEvents,
} from 'fsm/src/machines/websocket-client/websocket-client.events'
import type { UnrealMachineId } from 'src/domain/unreal'

import actions from './signaling.actions'
import { PeerConnectionEventType, type PeerConnectionEvents } from '../peer-connection/peer-connection.events'
import { IceEventType, SignalingServerEventType } from 'src/domain/webrtc.events'


// Events
// ——————
export type SignalingEvents = PeerConnectionEvents | WebSocketClientEvents

// Context
// ———————
export type SignalingContext = {
    url: URL
    unrealId: UnrealMachineId
    rtcConfiguration: RTCConfiguration
    websocketMachine?: ActorRef<WebSocketClientEvents>
    peerConnectionMachine?: ActorRef<PeerConnectionEvents>
}

// Schema
// ——————
export interface SignalingStateSchema {
    states: {
        init: {}

        connecting: {
            states: {
                websocket: {}
                peerConnection: {}
            }
        }

        // after the connection has been established, we're done
        connected: {}

        // something went wrong
        error: {}
    }
}


// Configuration
// —————————————
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
            // * Note: although we actually use (ie. send any data over)
            //   the websocket only during the signalling-stage, we cannot discard
            //   the connection, because it also acts as an indicator to the
            //   signaling server that we (the player) are still there.
            entry: 'spawnWebsocketMachine',
            on: {
                ws_client_open: { target: 'ok' },
                ws_client_error: { target: 'error' },
            },
        },

        connecting: {
            initial: 'websocket',
            states: {
                websocket: {
                    // send a start request to the signaling server
                    // we're expecting a Signaling.Configuration message in response
                    entry: 'startSignaling',
                    on: {
                        // received via a parsed websocket-message
                        [SignalingServerEventType.Configuration]: {
                            actions: 'spawnPeerConnectionMachine',
                            target: 'peerConnection',
                        },
                    },
                },

                peerConnection: {
                    on: {

                        // Events sent by the peer connection machine
                        // ——————————————————————————————————————————

                        // The first thing the peer connection does is create an RTCSessionDescription 'offer'
                        // which is
                        //  1. set as the 'local-description' inside the peer connection
                        //  2. Forwarded to the signaling server (websocket)  ←  'you are here'
                        [IceEventType.Offer]: {
                            actions: 'sendViaWebSocket',
                        },

                        // When we're receiving an ice candidate from the peer connection, forward it to the websocket
                        [IceEventType.IceCandidate]: {
                            actions: 'sendViaWebSocket',
                        },

                        // after the peer connection has been established, we're done
                        // We're passing along the peer connection top the parent
                        [PeerConnectionEventType.Ready]: {
                            actions: 'sendToParent',
                            target: 'connected'
                        },

                        // Events sent by the signaling server (websocket)
                        // ———————————————————————————————————————————————
                        [SignalingServerEventType.PlayerCount]: {}, // ignore

                        [SignalingServerEventType.Answer]: {
                            actions: 'sendToPeerConnection',
                        },
                        [SignalingServerEventType.IceCandidate]: {
                            actions: 'sendToPeerConnection',
                        },
                    },
                },
            },
            on: {
                // When receiving a message from the websocket,
                // we know it can only contain a Signaling event
                // So we can safely parse the string into an event and re-send it.
                [WebSocketClientReplyType.Message]: {
                    actions: 'parseAndSendWebSocketMessage',
                },
            },
        },

        connected: {},
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
