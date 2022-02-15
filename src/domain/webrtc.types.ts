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

export type WebRTCState = {
    connectionState: RTCPeerConnectionState
    iceConnectionState: RTCIceConnectionState
    iceGatheringState: RTCIceGatheringState
    signalingState: RTCSignalingState
}

// export const initialWebRTCState = (): WebRTCState => ({
//     connectionState: 'new',
//     iceConnectionState: 'new',
//     iceGatheringState: 'new',
//     signalingState: 'closed',
// })

// export const defaultPeerConnectionOptions = () => ({
//     sdpSemantics: 'unified-plan',

//     // Quote: "possible fix for WebRTC Chrome 89 issues"
//     // Whatever this might mean.
//     offerExtmapAllowMixed: false,
// })
