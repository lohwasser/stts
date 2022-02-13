import {
    PixelstreamingEvent,
    PixelstreamingCommandType,
} from './pixelstreaming.events'
import type {
    PixelstreamingConfig,
    PixelstreamingMachine,
    PixelstreamingOptions,
    PixelstreamingStateNode,
    PixelstreamingStateSchema,
    PixelstreamingStatesConfig,
    PixelstreamingTypestate,
    PixelstreamingXStateSvelteResponse,
} from './pixelstreaming.types'

import { ActorRef, assign, Machine, send } from 'xstate'
import { useMachine } from '@xstate/svelte'

import type { InputMachine } from '../input/input.types'
import { VideoEvent, VideoEventType } from './video.event'
import {
    emptyVideoStats,
    PeerConnectionParameters,
    VideoStats,
    WebRTCEventType,
    WebRTCStats,
} from '$lib/domain/webrtc'
import type { PixelstreamingError } from './errors'

export type MatchmakingResponse = {
    signalingUrl: URL
    peerConnectionParameters: PeerConnectionParameters
}

export type OnTrackFn = (trackEvent: RTCTrackEvent) => void

export type VideoMetadata = {
    width: number
    height: number
    framerate: number
}

export type PixelstreamingContext = {
    // the actual DOM elment in which our stream is being played
    playerElement: HTMLVideoElement

    // the HTTP(s) URL we query for a webSocket-endpoint
    matchmakingUrl: URL

    // the WS(s) URL via which we hadle the webRTC-signaling
    signalingUrl: URL

    // the STUN/TURN configuration used during ICE
    // (Interactive connectivity establishment)
    peerConnectionParameters: PeerConnectionParameters

    // the actual connection we create during ice
    peerConnection: RTCPeerConnection
    dataChannel: RTCDataChannel

    // the websocket connected to the signalingUrl
    websocket: WebSocket

    // The actor which handles our peer connection
    iceActor: ActorRefFrom<ICEMachine>

    // The actor which handles player-input
    inputActor: ActorRefFrom<InputMachine>

    videoQualityActor: ActorRefFrom<VideoQualityMachine>
    videoEventListener: ActorRef<VideoEvent>

    // callback-function for TrackEvents
    onTrack: OnTrackFn

    // the current error (if any)
    error: PixelstreamingError

    // stats
    statsIntervalMillis: number
    statsWindowSize: number
    statsListener: ActorRef<WebRTCStats>
    videoMetadata: VideoMetadata
    videoStats: VideoStats
}

export const defaultPixelstreamingContext = (): PixelstreamingContext => ({
    error: undefined,
    inputActor: undefined,
    matchmakingUrl: undefined,
    onTrack: undefined,
    iceActor: undefined,
    peerConnectionParameters: undefined,
    playerElement: undefined,
    signalingUrl: undefined,
    videoEventListener: undefined,
    videoQualityActor: undefined,
    videoMetadata: {
        width: undefined,
        height: undefined,
        framerate: undefined,
    },
    videoStats: emptyVideoStats(),
    websocket: undefined,
    peerConnection: undefined,
    dataChannel: undefined,

    statsIntervalMillis: 800,
    statsWindowSize: 8,
    statsListener: undefined,
})

export interface PixelstreamingStates extends PixelstreamingStateSchema {
    states: {
        idle: PixelstreamingStateSchema
        matchmaking: PixelstreamingStateSchema
        websocket: PixelstreamingStateSchema
        ice: PixelstreamingStateSchema
        ready: PixelstreamingStateSchema
        playing: PixelstreamingStateSchema
        error: PixelstreamingStateSchema
        reset: PixelstreamingStateSchema
    }
}

const states: PixelstreamingStatesConfig = {
    // Wait for the initialization event
    // sent after the DOM has finished loading
    idle: {
        on: {
            [PixelstreamingCommandType.Initialize]: {
                actions: [
                    'assignPlayerElement',
                    () => console.log('Initialize Pixelstreaming'),
                    'spawnVideoListener',
                ],
                target: 'matchmaking',
            },
        },
    },

    // Query the matchmaker for a (websocket) signaling-endpoint
    matchmaking: {
        invoke: {
            src: 'queryMatchmaker',
            onDone: {
                actions: [
                    'assignSignalingURL',
                    'assignPeerConnectionParameters',
                ],
                target: 'websocket',
            },
            onError: {
                target: 'error',
                actions: assign({
                    error: (_c, error) => error.data,
                }),
            },
        },
    },

    // Open the websocket connection to the signaling-server
    // Note: although we acutally use (ie. send any data over)
    // the websocket only during the signalling, we cannot discard
    // the connection, because it also acts as an indicator to the
    // signaling server that we (the player) are still there.
    websocket: {
        invoke: {
            src: 'openWebsocket',
            onDone: {
                actions: 'assignWebsocket',
                target: 'ice',
            },
            onError: 'error',
        },
    },

    ice: {
        entry: 'spawnICEMachine',
        on: {
            'ICE_TRACK': { actions: 'addTrack' },
            'ICE_CONNECTIONS': { actions: 'assignConnections' },
            [VideoEventType.LoadedMetadata]: {
                actions: 'setVideoMetadata',
                target: 'ready',
            },

            // ignore these
            [VideoEventType.LoadStart]: {},
            'done.invoke.ice': {},

            '*': {
                actions: (c, event) => console.log('PIXEL ICE EVENT', event),
            },
        },
    },

    ready: {
        entry: [
            (_context) => console.log('Pixelstreaming ready!'),
            'spawnInputMachine',
            'spawnVideoQualityMachine',
            'spawnStatsListener',
        ],
        on: {
            [PixelstreamingCommandType.Play]: 'playing',
            [WebRTCEventType.WebRtcStats]: { actions: 'updateStats' },
        },
    },

    playing: {
        invoke: {
            id: 'playVideo',
            src: 'playVideo',
            onDone: { actions: () => console.log('Playing video') },
            onError: {
                actions: () => console.error('error playing video'),
            },
        },
        on: {
            [WebRTCEventType.WebRtcStats]: { actions: 'updateStats' },
            // [PixelstreamingEventType.Pause]: 'shutdown',
        },
    },

    error: {
        entry: () => console.log('ERRORR STATE'),
        on: {
            [PixelstreamingCommandType.Reset]: {
                actions: () => console.error('resetttt'),
                target: 'reset',
            },
        },
    },

    reset: {
        always: {
            target: 'matchmaking',
        },
    },

    // shutdown: {
    //     entry: ['closePeerConnection'],
    // },
}

const config: PixelstreamingConfig = {
    id: 'PixelstreamingMachine',
    initial: 'idle',
    context: undefined,
    states,
    on: {
        '*': {
            actions: (_c, event) =>
                console.log('unexpected pixelstreaming event', event),
        },
    },
}

import actions from './pixelstreaming.actions'
import guards from './pixelstreaming.guards'
import services from './pixelstreaming.services'
import type { ICEMachine } from '../ice/ice.types'
import type { VideoQualityMachine } from '../video-quality/video-quality.types'

const options: Partial<PixelstreamingOptions> = {
    actions: actions,
    services: services,
    guards: guards,
}

export const initialize = (
    partialContext: Partial<PixelstreamingContext> = {}
): PixelstreamingXStateSvelteResponse => {
    const machine: PixelstreamingMachine = Machine(config, options)
    const context: PixelstreamingContext = makeContext(partialContext)
    const contextualizedMachine: PixelstreamingStateNode =
        machine.withContext(context)
    return useMachine<
        PixelstreamingContext,
        PixelstreamingEvent,
        PixelstreamingTypestate
    >(contextualizedMachine, {})
}

const makeContext = (
    partialContext: Partial<PixelstreamingContext>
): PixelstreamingContext => ({
    ...defaultPixelstreamingContext(),
    ...partialContext,
})
