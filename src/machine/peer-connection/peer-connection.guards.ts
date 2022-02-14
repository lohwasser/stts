import { assign, sendParent, spawn } from 'xstate'
import { assign as immerAssign } from '@xstate/immer'
import type { PeerConnectionContext } from './peer-connection.machine'

import listener from './peer-connection.listener'
import { SignalingEventType } from '../signaling/signaling.events'
import type { PeerConnectionEvents } from './peer-connection.events'
import type { WebRTCState } from 'src/domain/webrtc.types'
import type { IceEvents, IceStateChange } from 'src/domain/ice.events'

export default {
    connectionEstablished: (
        _context: PeerConnectionContext,
        event: IceEvents
    ): boolean => {
        const { state } = event as IceStateChange
        const {
            connectionState,
            iceConnectionState,
            iceGatheringState,
            signalingState,
        } = state
        const finished =
            connectionState === 'connected' &&
            iceConnectionState === 'connected' &&
            iceGatheringState === 'complete' &&
            signalingState === 'stable'

        if (finished) console.log('ICE connection established. Hooray!')

        return finished
    },
}
