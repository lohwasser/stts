import type { WebRTCState } from './webrtc.types'

export type WebRTCEvents = 
    | SignalingServerEvents
    | IceEvents

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

export enum IceEventType {
    Offer = 'offer',
    Track = 'ice_track',
    IceCandidate = 'peer_connection_ice_candidate',
    StateChange = 'peer_connection_state_change',
    Connections = 'ice_connections',
    Error = 'ice_error',
}

export type IceEvents =
    | Offer
    | Track
    | PeerConnectionIceCandidate
    | StateChange
    | Connections
    | Error

export type Offer = {
    type: IceEventType.Offer
    sdp: string
}

export type Track = {
    type: IceEventType.Track
    event: RTCTrackEvent
}

export type PeerConnectionIceCandidate = {
    type: IceEventType.IceCandidate
    candidate: RTCIceCandidate
}

export type StateChange = {
    type: IceEventType.StateChange
    state: WebRTCState
}

export type Connections = {
    type: IceEventType.Connections
    peerConnection: RTCPeerConnection
    dataChannel: RTCDataChannel
}

export type Error = {
    type: IceEventType.Error
    error: unknown
}
