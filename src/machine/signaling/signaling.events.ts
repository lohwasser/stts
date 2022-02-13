import type { WebSocketClientEvents } from 'fsm/src/machines/websocket-client/websocket-client.events'
import type { WebRTCState } from 'src/domain/webrtc'


export enum SignalingEventType {
    Configuration = 'configuration',
    PlayerCount = 'player_count',
    Answer = 'answer',
    IceCandidate = 'ice_candidate',
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

enum IceEventType {
    Track = 'ice_track',
    Candidate = 'ice_candidate',
    State = 'ice_state',
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
    type: IceEventType.State
    state: WebRTCState
}

export type IceConnections = {
    type: IceEventType.Connections
    peerConnection: RTCPeerConnection
    dataChannel: RTCDataChannel
}

// export type IceDone = {
//   type: IceEventType.Done
// }

export type IceError = {
    type: IceEventType.Error
    error: unknown
}
