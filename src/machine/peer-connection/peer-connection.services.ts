import type { PeerConnectionContext } from './peer-connection.machine'

export default {
    createSessionDescription: (
        context: PeerConnectionContext
    ): Promise<RTCSessionDescriptionInit> => {
        const { peerConnection, sdpConstraints } = context
        return peerConnection.createOffer(sdpConstraints)
    },
}
