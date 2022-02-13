import type { WebSocketClientEvents } from 'fsm/src/machines/websocket-client/websocket-client.events'
import type { IceEvents } from 'src/domain/ice.events'

export enum SignalingEventType {
    Configuration = 'configuration',
    PlayerCount = 'player_count',
    Answer = 'answer',
    Offer = 'offer',
}

export type SignalingEvents =
    | Configuration
    | PlayerCount
    | Answer
    | Offer
    | IceEvents
    | WebSocketClientEvents

export type Configuration = {
    type: SignalingEventType.Configuration
    peerConnectionOptions: RTCConfiguration
}

export type PlayerCount = {
    type: SignalingEventType.PlayerCount
    count: number
}

export type Answer = {
    type: SignalingEventType.Answer
    sdp: string
}

export type Offer = {
    type: SignalingEventType.Offer
    sdp: string
}
