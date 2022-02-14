import { createMachine, type MachineConfig, type ActorRef } from 'xstate'

import {
    WebSocketClientReplyType,
    type WebSocketClientEvents,
} from 'fsm/src/machines/websocket-client/websocket-client.events'
import type { UnrealMachineId } from 'src/domain/unreal'
import { PeerConnectionEventType, type PeerConnectionEvents } from '../peer-connection/peer-connection.events'
import { IceEventType, SignalingServerEventType } from 'src/domain/webrtc.events'

import actions from './signaling.actions'
import services from './signaling.services'
import type { SignalingEvents } from './signaling.events'

// Context
// ———————
export type SignalingContext = {

    // the URL of the matchmaking server
    matchmakingUrl: URL

    // the URL of the signaling server
    signalingUrl: URL

    // the id of the unreal machine to connect to
    // (received from the matchmaker)
    unrealId?: UnrealMachineId

    // configuration options for the peer connection
    // (received from the matchmaker)
    rtcConfiguration?: RTCConfiguration

    // agent for handling the websocket connection with the
    // signaling server
    websocketMachine?: ActorRef<WebSocketClientEvents>

    // agent for handling the peer-connection
    peerConnectionMachine?: ActorRef<PeerConnectionEvents>
}

// Schema
// ——————
export interface SignalingStateSchema {
    states: {
        // First we have to query the matchmaker for an 
        // Unreal machine to connect to
        matchmaking: {}

        // Then we start the 'Interactive Connectivity Establishment' (ICE)
        ice: {}

        // after the connection has been established, we're done
        connected: {}

        // something went wrong
        error: {}
    }
}


// Configuration
// —————————————
const machineConfig = ({
    matchmakingUrl,
    signalingUrl,
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
        matchmakingUrl,
        signalingUrl,
        unrealId: undefined,
        rtcConfiguration: undefined,
        websocketMachine: undefined,
        peerConnectionMachine: undefined,
    },

    // Open the websocket connection to the signaling-server
    // * Note: although we actually use (ie. send any data over)
    //   the websocket only during the signalling-stage, we cannot discard
    //   the connection, because it also acts as an indicator to the
    //   signaling server that we (the player) are still there.
    entry: 'spawnWebsocketMachine',

    initial: 'matchmaking',
    states: {
        matchmaking: {
            invoke: {
                src: 'queryMatchmaker',
                // todo: handle 'no_instance'
                onDone: { 
                    actions: ['assignUnrealId', 'assignPeerConnectionParameters'],
                    target: 'ice', 
                },
                onError: { target: 'error' },
            },
            
        },

        ice: {
            // send a start request to the signaling server
            // we're expecting a Signaling.Configuration message in response
            entry: 'startSignaling',
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

                // The contents of 'track' and 'connections' events
                // are used by the VideoHTML element of the parent machine
                [IceEventType.Track]: {
                    actions: 'sendToParent',
                },
                [IceEventType.Connections]: {
                    actions: 'sendToParent',
                },

                // after the peer connection has been established, we're done
                // We're passing along the peer connection top the parent
                [PeerConnectionEventType.Ready]: {
                    actions: 'sendToParent',
                    target: 'connected'
                },

                // Events sent by the signaling server (websocket)
                // ———————————————————————————————————————————————

                // received via a parsed websocket-message
                [SignalingServerEventType.Configuration]: {
                    actions: 'spawnPeerConnectionMachine',
                    target: 'peerConnection',
                },

                [SignalingServerEventType.PlayerCount]: {}, // ignore

                [SignalingServerEventType.Answer]: {
                    actions: 'sendToPeerConnection',
                },
                [SignalingServerEventType.IceCandidate]: {
                    actions: 'sendToPeerConnection',
                },

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
        ws_client_open: { target: 'ok' },
        ws_client_error: { target: 'error' },
        '*': {
            actions: (_c, event) =>
                console.warn('Unexpected Websocket event:', { event }),
        },
    },
})

export const makeSignalingMachine = (config: SignalingMachineConfiguration) =>
    createMachine<SignalingContext, SignalingEvents>(machineConfig(config), {
        actions, services,
    })

export type SignalingMachineConfiguration = {
    matchmakingUrl: URL
    signalingUrl: URL
}
