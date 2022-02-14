import type { WebRTCState } from './webrtc.types'

export type WebRTCEvents = PeerConnectionEvents | SignalingServerEvents

// Signaling server events
// ———————————————————————
export type SignalingServerEvents =
    | Answer
    | Configuration
    | PlayerCount
    | SignalingIceCandidate

export enum SignalingServerEventType {
    Answer = 'answer',
    Configuration = 'configuration',
    PlayerCount = 'player_count',
    IceCandidate = 'signaling_ice_candidate',
}

export type Answer = {
    type: SignalingServerEventType.Answer
    sdp: string
}

export type Configuration = {
    type: SignalingServerEventType.Configuration
    peerConnectionOptions: RTCConfiguration
}

export type PlayerCount = {
    type: SignalingServerEventType.PlayerCount
    count: number
}

export type SignalingIceCandidate = {
    type: SignalingServerEventType.IceCandidate
    candidate: RTCIceCandidate
}

// Peer connection events
// ——————————————————————

export enum PeerConnectionEventType {
    Offer = 'offer',
    Track = 'ice_track',
    IceCandidate = 'ice_candidate',
    StateChange = 'pc_state_change',
    Connections = 'pc_connections',
    Error = 'pc_error',
}

export type PeerConnectionEvents =
    | Offer
    | Track
    | PeerConnectionIceCandidate
    | StateChange
    | Connections
    | Error

export type Offer = {
    type: PeerConnectionEventType.Offer
    sdp: string
}

export type Track = {
    type: PeerConnectionEventType.Track
    event: RTCTrackEvent
}

export type PeerConnectionIceCandidate = {
    type: PeerConnectionEventType.IceCandidate
    candidate: RTCIceCandidate
}

export type StateChange = {
    type: PeerConnectionEventType.StateChange
    state: WebRTCState
}

export type Connections = {
    type: PeerConnectionEventType.Connections
    peerConnection: RTCPeerConnection
    dataChannel: RTCDataChannel
}

export type Error = {
    type: PeerConnectionEventType.Error
    error: unknown
}
