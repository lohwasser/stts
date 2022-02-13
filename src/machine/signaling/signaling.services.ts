import type { SignalingContext } from './signaling.machine'

export default {
    createWebRtcOffer: (
        context: SignalingContext
    ): Promise<RTCSessionDescriptionInit> => {
        const { peerConnection } = context
        const sdpConstraints = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        }
        return peerConnection!.createOffer(sdpConstraints)
    },
}
