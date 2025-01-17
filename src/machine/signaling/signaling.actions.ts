import { spawn, send, sendParent } from 'xstate'
import { assign as immerAssign } from '@xstate/immer'
import { makeWebSocketClientMachine } from 'fsm/src/machines/websocket-client/websocket-client.machine'
import type { SignalingContext } from './signaling.machine'
import {
    WebSocketClientCommandType,
    type WebSocketClientMessage,
} from 'fsm/src/machines/websocket-client/websocket-client.events'
import { makePeerConnectionMachine } from '../peer-connection/peer-connection.machine'
import type { MatchmakingOk } from '../connection/connection.events'
import type { SignalingEvents } from './signaling.events'

export default {
    // Relay the given to event to the parent machine
    sendToParent: sendParent(
        (_context: SignalingContext, event: SignalingEvents) => event
    ),

    assignUnrealId: immerAssign(
        (context: SignalingContext, event: SignalingEvents) => {
            const { unrealId } = event as MatchmakingOk
            context.unrealId = unrealId
        }
    ),

    assignPeerConnectionParameters: immerAssign(
        (context: SignalingContext, event: SignalingEvents) => {
            const { peerConnectionParameters } = event as MatchmakingOk
            context.rtcConfiguration = peerConnectionParameters
        }
    ),

    // Spawn a websocket agent
    spawnWebSocketMachine: immerAssign((context: SignalingContext) => {
        const machine = makeWebSocketClientMachine(context.signalingUrl)
        context.websocketMachine = spawn(machine, 'websocket')
    }),

    // Called after we received an answer from the matchmaker.
    // Sends a 'connect' message to the signaling server
    startSignaling: send(
        (context: SignalingContext) => {
            const data = JSON.stringify({
                type: 'connect',
                instance: context.unrealId,
            })
            return { type: 'ws_client_send', data }
        },
        { to: 'websocket' }
    ),

    // When receiving a message from the websocket,
    // we know it can only contain a Signaling event
    // So we can parse the string into an event and re-send it.
    parseAndSendWebSocketMessage: send((_context, event: SignalingEvents) => {
        const { message } = event as WebSocketClientMessage
        const signalingEvent = JSON.parse(message) as SignalingEvents

        console.log('parsed signaling event:', signalingEvent)

        return signalingEvent
    }),

    // Spawn the peer-connection agent
    spawnPeerConnectionMachine: immerAssign(
        (context: SignalingContext, _event: SignalingEvents) => {
            const { rtcConfiguration } = context
            const machine = makePeerConnectionMachine(rtcConfiguration!)
            context.peerConnectionMachine = spawn(machine, 'peerconnection')
        }
    ),

    // Send a an event *via* the websocket
    // ie. stringify the event and send it to the websocket machine as a 'send' event
    sendViaWebSocket: send(
        (_c: SignalingContext, event: SignalingEvents) => ({
            type: WebSocketClientCommandType.Send,
            data: JSON.stringify(event),
        }),
        { to: 'websocket' }
    ),

    // Forward a an event to the peer connection machine 'as-is'
    sendToPeerConnection: send(
        (_c: SignalingContext, event: SignalingEvents) => {
            console.debug('Forwarding event to peer connection', event)
            return event
        },
        { to: 'peerconnection' }
    ),
}
