import { spawn, send, assign } from 'xstate'
import { assign as immerAssign } from '@xstate/immer'

import type { MainContext } from './main.machine'
import type { InitializePixelstreaming, MainEvents } from './main.events'
import { makeSignalingMachine } from '../signaling/signaling.machine'
import type { Track } from 'src/domain/webrtc.events'
import { fromEvent, map, merge, Observable } from 'rxjs'
import type { PeerConnectionReady } from '../peer-connection/peer-connection.events'
import { makeInputMachine } from '../input/input.machine'
import { VideoEventType, type VideoEvent } from './video.event'

export default {
    // store the video element passed by the svelte-app
    assignVideoElement: assign({
        videoElement: (_context, event: MainEvents) => {
            const { videoElement } = event as InitializePixelstreaming
            return videoElement
        },
    }),

    assignPeerConnection: assign({
        peerConnection: (_context, event) => {
            const { connection } = event as PeerConnectionReady
            return connection
        },
    }),

    createDataChannel: assign({
        dataChannel: (_context, event) => {
            const { connection } = event as PeerConnectionReady
            const datachannelOptions = { ordered: true }
            const label = 'p1x3l'
            return connection.createDataChannel(label, datachannelOptions)
        },
    }),

    // setVideoMetadata: assign({
    //     videoMetadata: (context: MainContext) => {
    //         const { videoElement } = context

    //         console.log('setVideoMetadata', videoElement!.videoWidth)

    //         const metadata: Partial<VideoMetadata> = {
    //             width: videoElement!.videoWidth,
    //             height: videoElement!.videoHeight,
    //         }
    //         const videoRatio =
    //             videoElement!.videoWidth / videoElement!.videoHeight
    //         const clientHeight = Math.round(
    //             videoElement!.clientWidth / videoRatio
    //         )
    //         videoElement!.style.height = `${clientHeight}px`

    //         return { ...context.videoMetadata, ...metadata }
    //     },
    // }),

    spawnVideoListener: assign({
        videoEventListener: (context: MainContext, event) => {
            const { videoElement } = context

            const loadStart$: Observable<VideoEvent> = fromEvent(
                videoElement!,
                'loadstart'
            ).pipe(map(() => ({ type: VideoEventType.LoadStart })))

            const loadedMetadata$: Observable<VideoEvent> = fromEvent(
                videoElement!,
                'loadedmetadata'
            ).pipe(map(() => ({ type: VideoEventType.LoadedMetadata })))

            const video$: Observable<VideoEvent> = merge(
                loadStart$,
                loadedMetadata$
            )
            return spawn(video$)
        },
    }),

    // Spawn an Observable agent that listens to video-events
    // spawnVideoListener: assign({
    //     videoEventListener: (context: MainContext) => {
    //         const { videoElement } = context
    //         const loadStart$ = fromEvent(videoElement!, 'loadstart').pipe(
    //             map(() => ({ type: VideoEventType.LoadStart }))
    //         )
    //         const loadedMetadata$ = fromEvent(
    //             videoElement!,
    //             'loadedmetadata'
    //         ).pipe(map(() => ({ type: VideoEventType.LoadedMetadata })))

    //         return merge(loadStart$, loadedMetadata$)
    //     }}),

    // Spawn a machine actor that performs the signaling
    spawnSignalingMachine: immerAssign((context) => {
        const mainContext = context as MainContext
        const { matchmakingUrl, signalingUrl } = mainContext
        console.debug('Spawn SignalingMachine', {
            matchmakingUrl,
            signalingUrl,
        })
        const machine = makeSignalingMachine({ matchmakingUrl, signalingUrl })
        console.debug('ConnectionMachine spawned!')
        mainContext.signalingMachine = spawn(machine, 'signaling')
    }),

    // spawnStatsListener: assign({
    //     statsListener: (context: MainContext) => {
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
    //     videoQualityActor: (context: MainContext) => {
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
    //     videoEventListener: (context: MainContext) => {
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
    //     videoMetadata: (context: MainContext) => {
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
