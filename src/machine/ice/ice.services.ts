import type { ICEContext } from './ice.machine'

const iceServices = {
    createWebRtcOffer: (
        context: ICEContext
    ): Promise<RTCSessionDescriptionInit> => {
        const { peerConnection, sdpConstraints } = context
        return peerConnection!.createOffer(sdpConstraints)
    },
}

export default iceServices
