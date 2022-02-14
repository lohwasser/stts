import { spawn, send, assign } from 'xstate'
import { assign as immerAssign } from '@xstate/immer'

import type { MainContext } from './main.machine'
import type { InitializePixelstreaming, MainEvents } from './main.events'
import { makeSignalingMachine } from '../signaling/signaling.machine'
import type { Track } from 'src/domain/webrtc.events'

const pixelstreamingActions = {

    assignVideoElement: assign({
        videoElement: (_context, event: MainEvents) => {
            const { videoElement } = event as InitializePixelstreaming
            return videoElement
        },
    }),

    spawnSignalingMachine: immerAssign((context) => {
        const mainContext = context as MainContext
        const { matchmakingUrl, signalingUrl } = mainContext
        console.debug('Spawn SignalingMachine', { matchmakingUrl, signalingUrl })
        const machine = makeSignalingMachine({ matchmakingUrl, signalingUrl })
        console.debug('ConnectionMachine spawned!')
        mainContext.signalingMachine = spawn(machine, 'signaling')
    }),

    // spawnInputMachine: assign({
    //     inputActor: (context: MainContext) => {
    //         const machine = makeInputMachine()
    //         const contextualizedMachine = machine.withContext({
    //             ...defaultInputContext(),
    //             playerElement: context.playerElement,
    //             peerConnection: context.peerConnection,
    //             dataChannel: context.dataChannel,
    //         })
    //         return spawn(contextualizedMachine, 'input')
    //     },
    // }),

    // spawnStatsListener: assign({
    //     statsListener: (context: PixelstreamingContext) => {
    //         const listener: Observable<WebRTCStats> = StatsListener(
    //             context.peerConnection,
    //             context.playerElement,
    //             context.statsIntervalMillis,
    //             context.statsWindowSize
    //         )
    //         return spawn(listener, 'stats')
    //     },
    // }),

    // spawnVideoQualityMachine: assign({
    //     videoQualityActor: (context: PixelstreamingContext) => {
    //         const machine = makeVideoQualityMachine()
    //         const contextualizedMachine = machine.withContext({
    //             ...defaultVideoQualityContext(),
    //             playerElement: context.playerElement,
    //             peerConnection: context.peerConnection,
    //             dataChannel: context.dataChannel,
    //         })
    //         return spawn(contextualizedMachine, 'videoQuality')
    //     },
    // }),

    // spawnVideoListener: assign({
    //     videoEventListener: (context: PixelstreamingContext) => {
    //         const playerElement = context.playerElement
    //         const loadStart$ = fromEvent(playerElement, 'loadstart').pipe(
    //             map(() => ({ type: VideoEventType.LoadStart }))
    //         )
    //         const loadedMetadata$ = fromEvent(
    //             playerElement,
    //             'loadedmetadata'
    //         ).pipe(map(() => ({ type: VideoEventType.LoadedMetadata })))
    //         const video$ = merge(loadStart$, loadedMetadata$)
    //         // .pipe(tap((event) => console.log("VIDEO EVENT", event)))

    //         return spawn(video$)
    //     },
    // }),

    // setVideoMetadata: assign({
    //     videoMetadata: (context: PixelstreamingContext) => {
    //         const player = context.playerElement

    //         console.log('setVideoMetadata', player.videoWidth)

    //         const metadata: Partial<VideoMetadata> = {
    //             width: player.videoWidth,
    //             height: player.videoHeight,
    //         }
    //         const videoRatio = player.videoWidth / player.videoHeight
    //         const clientHeight = Math.round(player.clientWidth / videoRatio)
    //         player.style.height = `${clientHeight}px`

    //         return { ...context.videoMetadata, ...metadata }
    //     },
    // }),

    // ███████╗███████╗███╗   ██╗██████╗
    // ██╔════╝██╔════╝████╗  ██║██╔══██╗
    // ███████╗█████╗  ██╔██╗ ██║██║  ██║
    // ╚════██║██╔══╝  ██║╚██╗██║██║  ██║
    // ███████║███████╗██║ ╚████║██████╔╝
    // ╚══════╝╚══════╝╚═╝  ╚═══╝╚═════╝

    sendToInput: send(
        (_context, event) => {
            console.log('sendToInput')
            return event
        },
        { to: 'input' }
    ),

    //  ██████╗ ████████╗██╗  ██╗███████╗██████╗
    // ██╔═══██╗╚══██╔══╝██║  ██║██╔════╝██╔══██╗
    // ██║   ██║   ██║   ███████║█████╗  ██████╔╝
    // ██║   ██║   ██║   ██╔══██║██╔══╝  ██╔══██╗
    // ╚██████╔╝   ██║   ██║  ██║███████╗██║  ██║
    //  ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
    setTrack: (context: MainContext, event: MainEvents) => {
        const trackEvent = (event as Track).event
        // console.log('handleOnTrack', trackEvent.streams)
        if (context.videoElement!.srcObject !== trackEvent.streams[0]) {
            console.log('setting video track')
            context.videoElement!.srcObject = trackEvent.streams[0]
        }
    },
}

export default pixelstreamingActions
