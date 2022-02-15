import {
    assign,
    createMachine,
    spawn,
    type ActorRef,
    type MachineConfig,
} from 'xstate'

import {
    PixelstreamingCommandType as Pixelstreaming,
    type MainEvents,
} from './main.events'
import type { SignalingEvents } from '../signaling/signaling.events'
import { IceEventType } from 'src/domain/webrtc.events'
import { PeerConnectionEventType } from '../peer-connection/peer-connection.events'
import type { InputEvents } from '../input/input.events'

import actions from './main.actions'
import { VideoEventType, type VideoEvent } from './video.event'
import { makeInputMachine } from '../input/input.machine'

export type MainContext = {
    // the URL of the matchmaking server
    matchmakingUrl: URL

    // the URL of the signaling server
    signalingUrl: URL

    // the HTML video element which renders the webRTC stream
    videoElement?: HTMLVideoElement

    peerConnection?: RTCPeerConnection
    dataChannel?: RTCDataChannel

    // Reference to the signaling machine agent
    signalingMachine?: ActorRef<SignalingEvents>

    // Reference to the agent handling user inputs
    inputMachine?: ActorRef<InputEvents>

    videoEventListener?: ActorRef<VideoEvent>
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

                // At some point during the connection establishment
                // (after the correct track has been set or whatever)
                // the HTMLVideoElement will fire a LoadedMetadata-event.
                // This tells us that the video is ready and that we can begin playing
                [VideoEventType.LoadedMetadata]: {
                    // actions: 'setVideoMetadata',
                    target: 'ok',
                },
            },
        },

        ok: {
            entry: [
                (_context) => console.log('Pixelstreaming ready!'),
                'spawnInputMachine',
                // 'spawnVideoQualityMachine',
                // 'spawnStatsListener',
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
            // on: {
            //     [WebRTCEventType.WebRtcStats]: { actions: 'updateStats' },
            // },
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
            actions: {
                ...actions,

                // For some mysterious reason, the ts-type-system gets very confused
                // about certain functions, if we define them externally
                // (It complains about something in the context being undefined…)
                // * As a workaround, we're implementing the problematic functions inside 'createMachine'
                // That way, we don't need to specify types and ts doesn't complain.

                spawnInputMachine: assign({
                    inputMachine: (context) => {
                        const machine = makeInputMachine(context.videoElement!)
                        return spawn(machine, 'input')
                    },
                }),
            },
            services: {},
        }
    )
