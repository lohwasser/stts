import type { WebRTCState } from "./webrtc"

export type WebRTCEvents =
    | IceEvents
    | Offer
    | Answer
    
export enum WebRTCEventType {
    Offer = 'offer',
    Answer = 'answer',
}
export type Offer = {
    type: WebRTCEventType.Offer
    sdp: string
}

export type Answer = {
    type: WebRTCEventType.Answer
    sdp: string
}

// ██╗ ██████╗███████╗
// ██║██╔════╝██╔════╝
// ██║██║     █████╗  
// ██║██║     ██╔══╝  
// ██║╚██████╗███████╗
// ╚═╝ ╚═════╝╚══════╝
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
