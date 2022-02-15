import type { Observable } from 'rxjs'
import type { StatsEvent } from './stats.event'

import chromeStats from './chrome'
import firefoxStats from './firefox'

export default (
    peerConnection: RTCPeerConnection,
    videoElement: HTMLVideoElement,
    interval: number,
    windowSize: number
): Observable<StatsEvent> =>
    // check if the navigator has mozilla specific properties
    (navigator as any).mozGetUserMedia
        ? firefoxStats(peerConnection, videoElement, interval)
        : chromeStats(peerConnection, interval, windowSize)
