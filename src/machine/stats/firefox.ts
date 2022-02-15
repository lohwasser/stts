import { Vector2 } from 'fsm/src/lib/vector'
import { Observable, Subscriber } from 'rxjs'
import { StatsEventType, type StatsEvent } from './stats.event'

export default (
    peerConnection: RTCPeerConnection,
    playerElement: HTMLVideoElement,
    interval: number
): Observable<StatsEvent> =>
    new Observable<StatsEvent>((observer: Subscriber<StatsEvent>) => {
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
                    observer.next({ type: StatsEventType.Video, stats })
                })
            })
        }

        getStats()
        setInterval(getStats, interval)

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return function cleanup() {}
    })
