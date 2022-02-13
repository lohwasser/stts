import { Vector2 } from 'fsm/src/lib/vector'

export type OnTrackFn = (trackEvent: RTCTrackEvent) => void

export type VideoMetadata = {
    width: number
    height: number
    framerate: number
}

export type IceServer = {
    urls: Array<string>
    username: string
    credential: string
}
export type PeerConnectionParameters = { iceServers: Array<IceServer> }
export type SdpConstraints = {
    offerToReceiveAudio: boolean
    offerToReceiveVideo: boolean
}

export type VideoStats = {
    byteRate: number
    frameRate: number
    videoResolution: Vector2
}

export const emptyVideoStats = (): VideoStats => ({
    byteRate: 0,
    frameRate: 0,
    videoResolution: new Vector2(0, 0),
})

export type WebRTCState = {
    connectionState: RTCPeerConnectionState
    iceConnectionState: RTCIceConnectionState
    iceGatheringState: RTCIceGatheringState
    signalingState: RTCSignalingState
}

export const initialWebRTCState = (): WebRTCState => ({
    connectionState: 'new',
    iceConnectionState: 'new',
    iceGatheringState: 'new',
    signalingState: 'closed',
})

export const defaultPeerConnectionOptions = () => ({
    sdpSemantics: 'unified-plan',

    // Quote: "possible fix for WebRTC Chrome 89 issues"
    // Whatever this might mean.
    offerExtmapAllowMixed: false,
})

export enum WebRTCEventType {
    StateChange = 'WEB_RTC_STATE_CHANGE',
    IceCandidate = 'WEB_RTC_ICE_CANDIDATE',
    Disconnected = 'WEB_RTC_DISCONNECTED',
    Error = 'WEB_RTC_ERROR',
    // Stats = 'PEER_CONNECTION_STATS',
    WebRtcStats = 'WEB_RTC_STATS',
}

export type WebRTCDisconnected = {
    type: WebRTCEventType.Disconnected
}

export type WebRTCStateChange = {
    type: WebRTCEventType.StateChange
    state: WebRTCState
}

export type WebRTCIceCandidate = {
    type: WebRTCEventType.IceCandidate
    candidate: RTCIceCandidate
}

export type WebRTCError = {
    type: WebRTCEventType.Error
    error: unknown
}

export type WebRTCStats = {
    type: WebRTCEventType.WebRtcStats
    stats: Partial<VideoStats>
}

export type PeerConnectionEvent =
    | WebRTCStateChange
    | WebRTCIceCandidate
    | WebRTCDisconnected
    | WebRTCError
    | VideoStats
