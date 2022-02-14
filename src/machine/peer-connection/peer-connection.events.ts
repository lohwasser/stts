// see: domain/webrtc.events

import type { WebRTCEvents } from "src/domain/webrtc.events"

export type PeerConnectionEvents = 
    | WebRTCEvents
    | PeerConnectionReady
    | PeerConnectionError

export enum PeerConnectionEventType {
    Ready = 'peer_connection_ready',
    Error = 'peer_connection_error',
}

export type PeerConnectionReady = {
    type: PeerConnectionEventType.Ready
    connection: RTCPeerConnection
}

export type PeerConnectionError = {
    type: PeerConnectionEventType.Error
    error: unknown
}