import axios from 'axios'
import { Observable, Subscriber } from 'rxjs'
import { PixelstreamingErrorType } from './errors'
import type { MatchmakingResponse, MainContext } from './main.machine'
import type {
    MatchmakingError,
    PixelstreamingServiceRecord,
} from './main.types'
import { VideoEvent, VideoEventType } from './video.event'

const instanceAvailable = (response: any | MatchmakingError): boolean =>
    (response as MatchmakingError).error === undefined

export default {
    playVideo: async (context: MainContext): Promise<void> => {
        return context.videoElement.play()
    },

    listenToVideoEvents: (context: MainContext): Observable<VideoEvent> =>
        new Observable<VideoEvent>((observer: Subscriber<VideoEvent>) => {
            const { videoElement } = context

            videoElement.addEventListener(
                'loadstart',
                () => {
                    observer.next({
                        type: VideoEventType.LoadStart,
                    })
                },
                true
            )

            videoElement.addEventListener(
                'loadedmetadata',
                () => {
                    observer.next({
                        type: VideoEventType.LoadedMetadata,
                    })
                },
                true
            )

            return function cleanup() {}
        }),
}

pixelstreamingServices
