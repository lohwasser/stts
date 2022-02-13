import type { WebRTCStats } from '$lib/domain/webrtc'
import type { Observable } from 'rxjs'

import firefoxStats from './firefox'
import chromeStats from './chrome'

const statsObservable = (
    peerConnection: RTCPeerConnection,
    playerElement: HTMLVideoElement,
    interval: number,
    windowSize: number
): Observable<WebRTCStats> =>
    navigator.mozGetUserMedia
        ? firefoxStats(peerConnection, playerElement, interval)
        : chromeStats(peerConnection, interval, windowSize)

export default statsObservable
