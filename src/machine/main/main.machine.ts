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

export type MainContext = {
    matchmakingUrl: URL
    signalingUrl: URL
    videoElement?: HTMLVideoElement
    signalingMachine?: ActorRef<SignalingEvents>
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
                    ],
                    target: 'initializing',
                },
            },
        },

        initializing: {
            entry: 'spawnSignalingMachine',
            on: {

                [IceEventType.Track]: {
                    actions: 'setTrack',
                },
                [IceEventType.Connections]: {
                    actions: 'sendToParent',
                },

                [PeerConnectionEventType.Ready]

                // "ICE_TRACK": { actions: 'addTrack' },
                // "ICE_CONNECTIONS": { actions: "assignConnections" },
                // [VideoEventType.LoadedMetadata]: {
                //     actions: 'setVideoMetadata',
                //     target: 'ready',
                // },
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
})

export const makeMainMachine = (matchmakingUrl: URL, signalingUrl: URL) =>
    createMachine<MainContext, MainEvents>(
        mainMachineConfig(matchmakingUrl, signalingUrl),
        {
            actions: {
                assignVideoElement: assign({
                    videoElement: (_context, event: MainEvents) => {
                        const { videoElement } =
                            event as InitializePixelstreaming
                        return videoElement
                    },
                }),

                spawnConnectionMachine: immerAssign((context) => {
                    const connectionMachine = makeConnectionMachine(
                        context.matchmakingUrl,
                        context.signalingUrl
                    )
                    context.connectionMachine = spawn(connectionMachine)
                }),
            },
            services: {},
        }
    )
