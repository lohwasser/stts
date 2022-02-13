import { WebRTCStats, VideoStats, WebRTCEventType } from '$lib/domain/webrtc'
import { Observable, Subscriber } from 'rxjs'
import { Vector2 } from 'three'

const firefoxStats = (
    peerConnection: RTCPeerConnection,
    playerElement: HTMLVideoElement,
    interval: number
): Observable<WebRTCStats> =>
    new Observable<WebRTCStats>((observer: Subscriber<WebRTCStats>) => {
        console.log('FIREFOX STATS')

        const getStats = (): void => {
            peerConnection.getStats(null).then((stats: RTCStatsReport) => {
                stats.forEach((stat) => {
                    const { type, kind } = stat
                    if (type !== 'inbound-rtp' || kind !== 'video') return

                    const { framerateMean, bitrateMean } = stat

                    const videoWidth = playerElement.videoWidth
                    const videoHeight = playerElement.videoHeight
                    const videoResolution = new Vector2(videoWidth, videoHeight)

                    const stats = {
                        frameRate: Math.round(framerateMean),
                        byteRate: Math.round(bitrateMean),
                        videoResolution,
                    }
                    observer.next({ type: WebRTCEventType.WebRtcStats, stats })
                })
            })
        }

        getStats()
        setInterval(getStats, interval)

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return function cleanup() {}
    })

export default firefoxStats
