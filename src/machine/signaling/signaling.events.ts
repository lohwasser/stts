import type { WebSocketClientEvents } from 'fsm/src/machines/websocket-client/websocket-client.events'
import type { WebRTCEvents } from 'src/domain/webrtc.events'

export type SignalingEvents = WebRTCEvents | WebSocketClientEvents
