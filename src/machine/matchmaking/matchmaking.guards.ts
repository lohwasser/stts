import type { WebRTCState } from 'src/domain/webrtc'
import type { ICEEvents, StateChange } from './matchmaking.events'
import type { ICEContext } from './matchmaking.machine.machine'

const iceGuards = {
    finished: (_context: ICEContext, event: ICEEvents): boolean => {
        const webRTCState: WebRTCState = (event as StateChange).state
        const {
            connectionState,
            iceConnectionState,
            iceGatheringState,
            signalingState,
        } = webRTCState
        const finished =
            connectionState === 'connected' &&
            iceConnectionState === 'connected' &&
            iceGatheringState === 'complete' &&
            signalingState === 'stable'

        if (finished) console.log('ICE finished!')

        return finished
    },
}

export default iceGuards
