import type { Observable } from 'rxjs'
import {
    assign,
    createMachine,
    sendParent,
    spawn,
    type ActorRef,
    type MachineConfig,
} from 'xstate'
import { StatsEventType, type StatsEvent } from './stats.event'

import StatsListener from './stats.listener'

// It's a bit overkill to have a dedicated machine for stats collection.
// Allows us to keep stat collection code organized
// Might refactor and pull into the main machine later.

export type StatsContext = {
    peerConnection: RTCPeerConnection
    videoElement: HTMLVideoElement
    listener?: ActorRef<StatsEvent>
}

export interface StatsStateSchema {
    states: {
        ok: {}
    }
}

const statsMachineConfig = (
    peerConnection: RTCPeerConnection,
    videoElement: HTMLVideoElement
): MachineConfig<StatsContext, StatsStateSchema, StatsEvent> => ({
    id: 'stats',
    schema: {
        context: {} as StatsContext,
        events: {} as StatsEvent,
    },
    context: {
        peerConnection,
        videoElement,
        listener: undefined,
    },
    initial: 'ok',
    states: {
        ok: {
            entry: 'spawnListener',
            on: {
                [StatsEventType.Video]: {
                    actions: 'sendToParent',
                },
            },
        },
    },
})

// export const makeMainMachine = (): StateMachine<MainContext, MainStateSchema, MainEvents> =>
export const makeStatsMachine = (
    peerConnection: RTCPeerConnection,
    videoElement: HTMLVideoElement
) => {
    const configuration = statsMachineConfig(peerConnection, videoElement)

    const interval = 800
    const windowSize = 8

    return createMachine<StatsContext, StatsEvent>(configuration, {
        actions: {
            sendToParent: sendParent(
                (_c: StatsContext, event: StatsEvent) => event
            ),

            spawnListener: assign({
                listener: (context) => {
                    const observable: Observable<StatsEvent> = StatsListener(
                        context.peerConnection,
                        context.videoElement,
                        interval,
                        windowSize
                    )
                    return spawn(observable)
                },
            }),

            // updateVideoElementSize: assign({
            //     playerElement: (context: StatsContext, event: InputEvent) => {
            //         const { stats } = event as WebRTCStats
            //         const videoResolution: Vector2 = stats.videoResolution
            //         const ratio: number = videoResolution.x / videoResolution.y

            //         const mainElement = document.getElementById('svelte')
            //         const maxWidth = mainElement.clientWidth * 0.8

            //         let { width, height } = videoResolution
            //         if (width > maxWidth) {
            //             width = maxWidth
            //             height = maxWidth / ratio
            //         }

            //         // context.playerElement.setAttribute("width", `${width}`)
            //         // context.playerElement.setAttribute("height", `${height}`)
            //         context.playerElement.style.width = `${width}px`
            //         context.playerElement.style.height = `${height}px`

            //         console.log('videoResolution', videoResolution)
            //         console.log('Set player element size', width, height)

            //         return context.playerElement
            //     },
            // }),
        },
    })
}
