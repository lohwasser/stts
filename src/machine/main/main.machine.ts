import {
    assign,
    createMachine,
    spawn,
    type ActorRef,
    type MachineConfig,
} from 'xstate'
import { assign as immerAssign } from '@xstate/immer'

import {
    PixelstreamingCommandType as Pixelstreaming,
    type InitializePixelstreaming,
    type MainEvents,
} from './main.events'
import type { SignalingEvents } from '../signaling/signaling.events'
import { IceEventType } from 'src/domain/webrtc.events'
import { PeerConnectionEventType } from '../peer-connection/peer-connection.events'
import { VideoEventType, type VideoEvent } from 'src/domain/video.events'
import type { VideoMetadata } from 'src/domain/webrtc.types'
import type { InputEvents } from '../input/input.events'

import actions from './main.actions'

export type MainContext = {
    // the URL of the matchmaking server
    matchmakingUrl: URL

    // the URL of the signaling server
    signalingUrl: URL

    // the HTML video element which renders the webRTC stream
    videoElement?: HTMLVideoElement

    videoEventListener?: ActorRef<VideoEvent>

    videoMetadata: VideoMetadata

    // Reference to the signaling machine agent
    signalingMachine?: ActorRef<SignalingEvents>

    peerConnection?: RTCPeerConnection
    dataChannel?: RTCDataChannel

    inputMachine?: ActorRef<InputEvents>
}

export interface MainStateSchema {
    states: {
        idle: {}
        initializing: {}
        ok: {
            states: {
                pause: {}
                play: {}
            }
        }
        error: {}
    }
}

const mainMachineConfig = (
    matchmakingUrl: URL,
    signalingUrl: URL
): MachineConfig<MainContext, MainStateSchema, MainEvents> => ({
    schema: {
        context: {} as MainContext,
        events: {} as MainEvents,
    },
    context: {
        matchmakingUrl,
        signalingUrl,
        videoElement: undefined,
        videoEventListener: undefined,
        videoMetadata: {
            width: 0,
            height: 0,
            framerate: 0,
        },
        signalingMachine: undefined,
        peerConnection: undefined,
        dataChannel: undefined,
        inputMachine: undefined,
    },
    id: 'MainMachine',
    initial: 'idle',
    states: {
        // Wait for the initialization event
        // which is sent after the DOM has finished loading
        idle: {
            on: {
                [Pixelstreaming.Initialize]: {
                    actions: [
                        () => console.log('Initialize Pixelstreaming'),

                        // The initialize event contains a reference to the
                        // HTML Video element we're interacting with
                        'assignVideoElement',

                        // start listening to video events
                        'spawnVideoListener',
                    ],
                    target: 'initializing',
                },
            },
        },

        initializing: {
            entry: 'spawnSignalingMachine',
            on: {
                // sent during connection establishment
                [IceEventType.Track]: {
                    actions: 'setTrack',
                },

                // sent after the peer connection has been established
                [PeerConnectionEventType.Ready]: {
                    actions: ['assignPeerConnection', 'createDataChannel'],
                },

                [VideoEventType.LoadedMetadata]: {
                    actions: 'setVideoMetadata',
                    target: 'ok',
                },
            },
        },

        ok: {
            entry: [
                (_context) => console.log('Pixelstreaming ready!'),
                'spawnInputMachine',
                'spawnVideoQualityMachine',
                'spawnStatsListener',
            ],
            initial: 'pause',
            states: {
                pause: {
                    on: {
                        pixelstreaming_play: { target: 'playing' },
                    },
                },
                play: {
                    invoke: {
                        id: 'playVideo',
                        src: 'playVideo',
                        onDone: { actions: () => console.log('Playing video') },
                        onError: {
                            actions: () => console.error('error playing video'),
                        },
                    },
                },
            },
            on: {
                [WebRTCEventType.WebRtcStats]: { actions: 'updateStats' },
            },
        },

        error: {
            entry: 'assignError',
            on: {
                pixelstreaming_reset: {
                    actions: () => console.error('Resetting…'),
                    target: 'initializing',
                },
            },
        },

        // shutdown: {
        //     entry: ['closePeerConnection'],
        // },
    },

    on: {},
})

export const makeMainMachine = (matchmakingUrl: URL, signalingUrl: URL) =>
    createMachine<MainContext, MainEvents>(
        mainMachineConfig(matchmakingUrl, signalingUrl),
        {
            // actions: {
            //     assignVideoElement: assign({
            //         videoElement: (_context, event: MainEvents) => {
            //             const { videoElement } =
            //                 event as InitializePixelstreaming
            //             return videoElement
            //         },
            //     }),

            //     spawnConnectionMachine: immerAssign((context) => {
            //         const connectionMachine = makeConnectionMachine(
            //             context.matchmakingUrl,
            //             context.signalingUrl
            //         )
            //         context.connectionMachine = spawn(connectionMachine)
            //     }),
            // },
            actions,
            services: {},
        }
    )
