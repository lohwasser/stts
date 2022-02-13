import { VideoStats, WebRTCEventType, WebRTCStats } from '$lib/domain/webrtc'
import { map, Observable, Subscriber, tap } from 'rxjs'
import { Vector2 } from 'three'

type ChromeVideoStats = {
    timestamp: number
    framesReceived: number
    bytesReceived: number
    videoResolution: Vector2
}

const chromeStats = (
    peerConnection: RTCPeerConnection,
    interval: number,
    windowSize: number
): Observable<WebRTCStats> => {
    const source$ = new Observable<ChromeVideoStats>(
        (observer: Subscriber<ChromeVideoStats>) => {
            const getStats = (): void => {
                peerConnection.getStats(null).then((stats: RTCStatsReport) => {
                    stats.forEach((stat) => {
                        const { type, kind } = stat
                        if (type !== 'inbound-rtp' || kind !== 'video') return

                        const {
                            timestamp,
                            framesReceived,
                            bytesReceived,
                            frameWidth,
                            frameHeight,
                        } = stat

                        const videoResolution = new Vector2(
                            frameWidth,
                            frameHeight
                        )

                        const videoStats: ChromeVideoStats = {
                            timestamp,
                            framesReceived,
                            bytesReceived,
                            videoResolution,
                        }

                        observer.next(videoStats)
                    })
                })
            }

            getStats()
            setInterval(getStats, interval)

            // eslint-disable-next-line @typescript-eslint/no-empty-function
            return function cleanup() {}
        }
    )

    let buffer: Array<ChromeVideoStats> = []

    return source$.pipe(
        tap((value) => {
            buffer = [...buffer, value]
            buffer = buffer.slice(-1 * windowSize)
        }),
        map(({ videoResolution }) => ({
            videoResolution,
            window: buffer,
        })),
        map(({ videoResolution, window }) => {
            const deltas = window.map(
                (
                    value: ChromeVideoStats,
                    index: number,
                    array: ChromeVideoStats[]
                ) => {
                    if (index === 0) return undefined
                    const previousValue = array[index - 1]
                    const Δt = value.timestamp - previousValue.timestamp
                    const Δf =
                        value.framesReceived - previousValue.framesReceived
                    const Δb = value.bytesReceived - previousValue.bytesReceived
                    return { Δt, Δf, Δb }
                }
            )
            return { videoResolution, deltas }
        }),
        map(({ videoResolution, deltas }) => {
            const δ = deltas.filter((v) => v !== undefined)
            const time = δ.reduce((sum, { Δt }) => sum + Δt, 0)
            const frames = δ.reduce((sum, { Δf }) => sum + Δf, 0)
            const frameRate = Math.round((1000 * frames) / time)

            const bytes = δ.reduce((sum, { Δb }) => sum + Δb, 0)
            const byteRate = Math.round((1000 * bytes) / time)

            return { videoResolution, frameRate, byteRate }
        }),
        map(({ videoResolution, frameRate, byteRate }) => {
            const stats: VideoStats = {
                byteRate,
                frameRate,
                videoResolution,
            }
            return { type: WebRTCEventType.WebRtcStats, stats }
        })
    )
}
export default chromeStats
