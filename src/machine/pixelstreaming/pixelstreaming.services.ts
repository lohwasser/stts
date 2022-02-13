import axios from 'axios'
import { Observable, Subscriber } from 'rxjs'
import { PixelstreamingErrorType } from './errors'
import type {
    MatchmakingResponse,
    PixelstreamingContext,
} from './pixelstreaming.machine'
import type {
    MatchmakingError,
    PixelstreamingServiceRecord,
} from './pixelstreaming.types'
import { VideoEvent, VideoEventType } from './video.event'

const instanceAvailable = (response: any | MatchmakingError): boolean =>
    (response as MatchmakingError).error === undefined

const pixelstreamingServices = {
    /**
     * Send a GET request to to the [[matchmakingUrl]].
     * In response we receive either a [[MatchmakingResponse]],
     * or a [[NoInstanceError]].
     *
     * The [[MatchmakingResponse]] tells us to which Websocket to connect to
     * and which STUN/TURN configuration (PeerConnectionParameters) to use.
     * The [[NoInstanceError]] tells us that there is currently no unreal engine available.
     */
    queryMatchmaker: async (
        context: PixelstreamingContext
    ): Promise<MatchmakingResponse> => {
        const url: URL = context.matchmakingUrl
        const urlString = url.toString()

        // GET query with double promise
        const response = await (await axios.get(urlString)).data

        if (instanceAvailable(response)) {
            return {
                signalingUrl: new URL(response.instance),
                peerConnectionParameters: response.peerConnectionParameters,
            }
        } else
            return Promise.reject({ type: PixelstreamingErrorType.NoInstance })
    },

    openWebsocket: async (context: PixelstreamingContext): Promise<WebSocket> =>
        new Promise((resolve, reject) => {
            const websocket = new WebSocket(`${context.signalingUrl}`)
            websocket.onopen = () => resolve(websocket)
            websocket.onerror = (error) => reject(error)
        }),

    playVideo: async (context: PixelstreamingContext): Promise<void> => {
        return context.playerElement.play()
    },

    listenToVideoEvents: (
        context: PixelstreamingContext
    ): Observable<VideoEvent> =>
        new Observable<VideoEvent>((observer: Subscriber<VideoEvent>) => {
            const playerElement = context.playerElement

            playerElement.addEventListener(
                'loadstart',
                () => {
                    observer.next({
                        type: VideoEventType.LoadStart,
                    })
                },
                true
            )

            playerElement.addEventListener(
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

export default pixelstreamingServices
