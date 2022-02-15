import { Vector2 } from 'fsm/src/lib/vector'
import { map, Observable, Subscriber, tap } from 'rxjs'
import { StatsEventType, type StatsEvent } from './stats.event'
import type { VideoStats } from './stats.types'

// internal type that will be mapped to
type ChromeVideoStats = {
    timestamp: number
    framesReceived: number
    bytesReceived: number
    videoResolution: Vector2
}

// delta helper for mapping ChromeVideoStats  →  VideoStats
type Δ = {
    δt: number
    δf: number
    δb: number
}

const source = (
    peerConnection: RTCPeerConnection,
    interval: number
): Observable<ChromeVideoStats> =>
    new Observable<ChromeVideoStats>(
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

export default (
    peerConnection: RTCPeerConnection,
    interval: number,
    windowSize: number
): Observable<StatsEvent> => {
    const source$: Observable<ChromeVideoStats> = source(
        peerConnection,
        interval
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
            const deltas: Array<Δ | undefined> = window.map(
                (
                    value: ChromeVideoStats,
                    index: number,
                    array: ChromeVideoStats[]
                ) => {
                    if (index === 0) return undefined
                    const previousValue = array[index - 1]
                    const δt = value.timestamp - previousValue.timestamp
                    const δf =
                        value.framesReceived - previousValue.framesReceived
                    const δb = value.bytesReceived - previousValue.bytesReceived
                    return { δt, δf, δb }
                }
            )
            return { videoResolution, deltas }
        }),
        map(({ videoResolution, deltas }) => {
            const δ = deltas.filter((v) => v !== undefined) as Array<Δ>
            const time = δ.reduce((sum, { δt }) => sum + δt, 0)
            const frames = δ.reduce((sum, { δf }) => sum + δf, 0)
            const frameRate = Math.round((1000 * frames) / time)

            const bytes = δ.reduce((sum, { δb }) => sum + δb, 0)
            const byteRate = Math.round((1000 * bytes) / time)

            return { videoResolution, frameRate, byteRate }
        }),
        map(({ videoResolution, frameRate, byteRate }) => {
            const stats: VideoStats = {
                byteRate,
                frameRate,
                videoResolution,
            }
            return { type: StatsEventType.Video, stats }
        })
    )
}
