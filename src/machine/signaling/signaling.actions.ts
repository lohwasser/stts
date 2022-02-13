import { spawn, send } from 'xstate'
import { assign as immerAssign } from '@xstate/immer'
import { makeWebSocketClientMachine } from 'fsm/src/machines/websocket-client/websocket-client.machine'
import type { SignalingContext } from './signaling.machine'
import type { SignalingEvents } from './signaling.events'
import {
    WebSocketClientCommandType,
    type WebSocketClientMessage,
} from 'fsm/src/machines/websocket-client/websocket-client.events'

export default {
    // Relay the given to event to the parent machine
    // sendToParent: sendParent(
    //     (_context: SignalingContext, event: SignalingEvents) => event
    // ),

    // Spawn a websocket agent
    spawnWebSocketMachine: immerAssign((context: SignalingContext) => {
        const machine = makeWebSocketClientMachine(context.url)
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
    // So we can parse the string into an event and send it.
    parseAndSendWebSocketMessage: send((_context, event: SignalingEvents) => {
        const { message } = event as WebSocketClientMessage
        const signalingEvent = JSON.parse(message)

        console.log('signaling event', signalingEvent)

        return signalingEvent
    }),

    // Create the peer-connection
    spawnPeerConnectionMachine: immerAssign(
        (context: SignalingContext, _event: SignalingEvents) => {
            // todo
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
}
