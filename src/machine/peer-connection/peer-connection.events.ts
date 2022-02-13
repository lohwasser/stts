import type { WebRTCState } from 'src/domain/webrtc'

export type PeerConnectionEvents = IceEvents

export enum IceEventType {
    Track = 'ice_track',
    Candidate = 'ice_candidate',
    StateChange = 'ice_state_change',
    Connections = 'ice_connections',
    Error = 'ice_error',
}

export type IceEvents =
    | IceTrack
    | IceCandidate
    | IceStateChange
    | IceConnections
    | IceError

// Incoming Messages
// —————————————————
export type IceTrack = {
    type: IceEventType.Track
    event: RTCTrackEvent
}

export type IceCandidate = {
    type: IceEventType.Candidate
    candidate: RTCIceCandidate
}

export type IceStateChange = {
    type: IceEventType.StateChange
    state: WebRTCState
}

export type IceConnections = {
    type: IceEventType.Connections
    peerConnection: RTCPeerConnection
    dataChannel: RTCDataChannel
}

export type IceError = {
    type: IceEventType.Error
    error: unknown
}
