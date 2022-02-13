import { spawn, send, assign } from 'xstate'
import { fromEvent, merge, Observable } from 'rxjs'
import { map, tap } from 'rxjs/operators'

import { makeInputMachine } from '../input/input.machine'
import { defaultInputContext } from '../input/input.machine'
import type { PixelstreamingFunctionMap } from './pixelstreaming.types'

import type {
    MatchmakingResponse,
    PixelstreamingContext,
    VideoMetadata,
} from './pixelstreaming.machine'
import type {
    InitializePixelstreaming,
    PixelstreamingEvent,
} from './pixelstreaming.events'
import type { PixelstreamingError } from './errors'
import type { ICEConnections, ICETrack } from '../ice/ice.events'
import { VideoEventType } from './video.event'
import { defaultICEContext, makeICEMachine } from '../ice/ice.machine'
import type { WebRTCStats } from '$lib/domain/webrtc'
import StatsListener from './stats/observable'
import {
    defaultVideoQualityContext,
    makeVideoQualityMachine,
} from '../video-quality/video-quality.machine'

const pixelstreamingActions: PixelstreamingFunctionMap = {
    //  █████╗ ███████╗███████╗██╗ ██████╗ ███╗   ██╗
    // ██╔══██╗██╔════╝██╔════╝██║██╔════╝ ████╗  ██║
    // ███████║███████╗███████╗██║██║  ███╗██╔██╗ ██║
    // ██╔══██║╚════██║╚════██║██║██║   ██║██║╚██╗██║
    // ██║  ██║███████║███████║██║╚██████╔╝██║ ╚████║
    // ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
    assignPlayerElement: assign({
        playerElement: (_context, event: PixelstreamingEvent) => {
            const { playerElement } = event as InitializePixelstreaming
            return playerElement
        },
    }),

    assignSignalingURL: assign({
        signalingUrl: (_context, event: any) => {
            const { signalingUrl } = event.data as MatchmakingResponse
            console.log(`signalingUrl: ${signalingUrl}`)
            return signalingUrl
        },
    }),

    assignPeerConnectionParameters: assign({
        peerConnectionParameters: (_context, event: any) => {
            const { peerConnectionParameters } =
                event.data as MatchmakingResponse
            return peerConnectionParameters
        },
    }),

    assignConnections: assign({
        peerConnection: (_context, event: any) => {
            const { peerConnection } = event as ICEConnections
            return peerConnection
        },
        dataChannel: (_context, event: any) => {
            const { dataChannel } = event as ICEConnections
            // console.log("assign dataChannel", dataChannel)
            return dataChannel
        },
    }),

    assignWebsocket: assign({
        websocket: (_context, event: any) => {
            return event.data
        },
    }),

    updateStats: assign({
        videoStats: (
            context: PixelstreamingContext,
            event: PixelstreamingEvent
        ) => {
            const { stats } = event as WebRTCStats
            return { ...context.videoStats, ...stats }
        },
    }),

    assignError: assign({
        error: (_context, event: PixelstreamingEvent) => {
            console.log('assig errror', event)
            return event as PixelstreamingError
        },
    }),

    resetInput: assign({
        inputActor: (context: PixelstreamingContext) => {
            if (context.inputActor) context.inputActor.stop()
            return undefined
        },
    }),

    resetError: assign({
        error: () => undefined,
    }),

    //  █████╗  ██████╗████████╗ ██████╗ ██████╗ ███████╗
    // ██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗██╔════╝
    // ███████║██║        ██║   ██║   ██║██████╔╝███████╗
    // ██╔══██║██║        ██║   ██║   ██║██╔══██╗╚════██║
    // ██║  ██║╚██████╗   ██║   ╚██████╔╝██║  ██║███████║
    // ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝

    spawnICEMachine: assign({
        iceActor: (context: PixelstreamingContext) => {
            console.debug('Spawn iceMachine')
            const machine = makeICEMachine()
            const sdpConstraints = {
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
            }
            const contextualizedMachine = machine.withContext({
                ...defaultICEContext(),
                websocket: context.websocket,
                sdpConstraints: sdpConstraints,
                peerConnectionParameters: {
                    ...context.peerConnectionParameters,
                },
            })
            return spawn(contextualizedMachine, 'ice')
        },
    }),

    spawnInputMachine: assign({
        inputActor: (context: PixelstreamingContext) => {
            const machine = makeInputMachine()
            const contextualizedMachine = machine.withContext({
                ...defaultInputContext(),
                playerElement: context.playerElement,
                peerConnection: context.peerConnection,
                dataChannel: context.dataChannel,
            })
            return spawn(contextualizedMachine, 'input')
        },
    }),

    spawnStatsListener: assign({
        statsListener: (context: PixelstreamingContext) => {
            const listener: Observable<WebRTCStats> = StatsListener(
                context.peerConnection,
                context.playerElement,
                context.statsIntervalMillis,
                context.statsWindowSize
            )
            return spawn(listener, 'stats')
        },
    }),

    spawnVideoQualityMachine: assign({
        videoQualityActor: (context: PixelstreamingContext) => {
            const machine = makeVideoQualityMachine()
            const contextualizedMachine = machine.withContext({
                ...defaultVideoQualityContext(),
                playerElement: context.playerElement,
                peerConnection: context.peerConnection,
                dataChannel: context.dataChannel,
            })
            return spawn(contextualizedMachine, 'videoQuality')
        },
    }),

    spawnVideoListener: assign({
        videoEventListener: (context: PixelstreamingContext) => {
            const playerElement = context.playerElement
            const loadStart$ = fromEvent(playerElement, 'loadstart').pipe(
                map(() => ({ type: VideoEventType.LoadStart }))
            )
            const loadedMetadata$ = fromEvent(
                playerElement,
                'loadedmetadata'
            ).pipe(map(() => ({ type: VideoEventType.LoadedMetadata })))
            const video$ = merge(loadStart$, loadedMetadata$)
            // .pipe(tap((event) => console.log("VIDEO EVENT", event)))

            return spawn(video$)
        },
    }),

    setVideoMetadata: assign({
        videoMetadata: (context: PixelstreamingContext) => {
            const player = context.playerElement

            console.log('setVideoMetadata', player.videoWidth)

            const metadata: Partial<VideoMetadata> = {
                width: player.videoWidth,
                height: player.videoHeight,
            }
            const videoRatio = player.videoWidth / player.videoHeight
            const clientHeight = Math.round(player.clientWidth / videoRatio)
            player.style.height = `${clientHeight}px`

            return { ...context.videoMetadata, ...metadata }
        },
    }),

    // ███████╗███████╗███╗   ██╗██████╗
    // ██╔════╝██╔════╝████╗  ██║██╔══██╗
    // ███████╗█████╗  ██╔██╗ ██║██║  ██║
    // ╚════██║██╔══╝  ██║╚██╗██║██║  ██║
    // ███████║███████╗██║ ╚████║██████╔╝
    // ╚══════╝╚══════╝╚═╝  ╚═══╝╚═════╝
    // closePeerConnection: send(() => ({ type: PeerConnectionEventType.Stop }), { to: 'peerConnection' }),

    sendToPeerConnection: send((_context, event) => event, {
        to: 'peerConnection',
    }),

    sendToInput: send(
        (_context, event) => {
            console.log('sendToInputsendToInput')
            return event
        },
        { to: 'input' }
    ),

    // resetPeerConnection: assign({
    //     peerConnectionActor: (context: PixelstreamingContext) => {
    //         context.peerConnectionActor.stop()
    //         return undefined
    //     },
    // }),

    //  ██████╗ ████████╗██╗  ██╗███████╗██████╗
    // ██╔═══██╗╚══██╔══╝██║  ██║██╔════╝██╔══██╗
    // ██║   ██║   ██║   ███████║█████╗  ██████╔╝
    // ██║   ██║   ██║   ██╔══██║██╔══╝  ██╔══██╗
    // ╚██████╔╝   ██║   ██║  ██║███████╗██║  ██║
    //  ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
    addTrack: (context: PixelstreamingContext, event: PixelstreamingEvent) => {
        const trackEvent = (event as ICETrack).event
        // console.log('handleOnTrack', trackEvent.streams)
        if (context.playerElement.srcObject !== trackEvent.streams[0]) {
            console.log('setting video track')
            context.playerElement.srcObject = trackEvent.streams[0]
        }
    },
}

export default pixelstreamingActions
