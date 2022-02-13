import type { SignalingEvents } from 'src/machine/signaling/signaling.events'
import type { WebRTCState } from 'src/domain/webrtc'

export type ICETrack = {
    type: 'ice_track'
    event: RTCTrackEvent
}

export type ICECandidate = {
    type: 'ice_candidate'
    candidate: RTCIceCandidate
}

export type ICEStateChange = {
    type: 'ice_state'
    state: WebRTCState
}

export type ICEConnections = {
    type: 'ice_connections'
    peerConnection: RTCPeerConnection
    dataChannel: RTCDataChannel
}

// export type ICEDone = {
//   type: "ice_done"
// }

export type ICEError = {
    type: 'ice_error'
    error: unknown
}

export type ICEEvents =
    | ICETrack
    | ICECandidate
    | ICEStateChange
    | ICEConnections
    | ICEError
    | SignalingEvents
