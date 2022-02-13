import {
    assign,
    spawn,
    actions,
    type ActorRef,
    type MachineConfig,
} from 'xstate'
import { fromEvent, map } from 'rxjs'
import { assign as immerAssign } from '@xstate/immer'

import PeerConnectionListener from './peerconnection.listener'
import type { SignalingEvents } from '../signaling/signaling.events'
import {
    defaultPeerConnectionOptions,
    initialWebRTCState,
    type PeerConnectionParameters,
    type SdpConstraints,
    type WebRTCState,
} from '../../domain/webrtc'
import type { ICEEvents } from './ice.events'

import { createMachine } from 'xstate'
import services from './ice.services'
import guards from './ice.guards'
import type { UnrealMachineId } from 'src/domain/unreal'

// Interactive Connectivity Establishment
export type ICEContext = {
    webSocket: WebSocket
    sdpConstraints: RTCOfferOptions
    peerConnectionParameters: PeerConnectionParameters
    unrealId: UnrealMachineId
    webRTCState: WebRTCState

    peerConnection?: RTCPeerConnection
    dataChannel?: RTCDataChannel

    peerConnectionListener?: ActorRef<ICEEvents>
    webSocketListener?: ActorRef<SignalingEvents>
}

export interface ICEStateSchema {
    states: {
        initializing: {
            states: {
                websocket: {}
                offer: {}
                gathering: {}
                // gatheringComplete: {}
                // stable: {}
            }
        }
        connected: {}
        error: {}
    }
}

const iceMachineConfig = (
    webSocket: WebSocket,
    peerConnectionParameters: PeerConnectionParameters,
    sdpConstraints: SdpConstraints
): MachineConfig<ICEContext, ICEStateSchema, ICEEvents> => ({
    schema: {
        context: {} as ICEContext,
        events: {} as ICEEvents,
    },

    context: {
        webSocket,
        peerConnectionParameters,
        sdpConstraints,
        webRTCState: initialWebRTCState(),

        peerConnection: undefined,
        dataChannel: undefined,

        peerConnectionListener: undefined,
        webSocketListener: undefined,
    },

    initial: 'initializing',
    states: {
        initializing: {
            initial: 'websocket',
            states: {
                // listen to the websocket for signaling_configuration messages
                websocket: {
                    entry: 'spawnWebsocketListener',
                    on: {
                        // the first message we expect to receive from the signaling-server
                        // are the PeerConnectionOptions
                        signaling_configuration: {
                            actions: 'openPeerConnection',
                            target: 'offer',
                        },
                    },
                },

                // start listening to the peer connection and create an offer
                offer: {
                    entry: 'spawnPeerConnectionListener',
                    invoke: {
                        src: 'createWebRtcOffer',
                        onDone: {
                            actions: ['sendToParent', 'sendOfferToServer'],
                            target: 'gathering',
                        },
                    },
                },

                gathering: {
                    entry: () => console.info('ice — iceGathering'),
                    on: {
                        ice_candidate: { actions: 'sendICECandidateToServer' },
                        ice_state: [
                            {
                                actions: 'setWebRTCState',
                                target: 'connected',
                                cond: 'finished',
                            },
                            {
                                actions: 'setWebRTCState',
                            },
                        ],
                    },
                },
            },
            on: {
                ice_track: { actions: 'relayToParent' },
                // received from the signaling server
                signaling_player_count: {}, // ignore
                signaling_answer: { actions: 'setRemoteDescription' },
                signaling_ice_candidate: { actions: 'addIceCandidate' },
            },
        },

        connected: {
            entry: [
                () => console.info('connected'),
                'sendConnectionsToParent',
                'stopWebsocketListener',
                'stopPeerConnectionListener',
            ],
            type: 'final',
        },

        error: {
            entry: [
                'sendErrorToParent',
                'stopWebsocketListener',
                'stopPeerConnectionListener',
            ],
            type: 'final',
        },
    },

    on: {
        '*': {
            actions: (c, event) =>
                console.log('ICE » unhandled event ›', event),
        },
    },
})

export const makeICEMachine = (
    webSocket: WebSocket,
    peerConnectionParameters: PeerConnectionParameters,
    sdpConstraints: SdpConstraints
) => {
    const configuration = iceMachineConfig(
        webSocket,
        peerConnectionParameters,
        sdpConstraints
    )
    return createMachine<ICEContext, ICEEvents>(configuration, {
        services: services,
        guards: guards,
        actions: {
            // listen to the websocket for incoming messages
            spawnWebsocketListener: assign({
                webSocketListener: (context) => {
                    const observable = fromEvent<SignalingEvents>(
                        context.webSocket,
                        'message'
                    ).pipe(
                        map(
                            (message: any) =>
                                JSON.parse(message.data) as SignalingEvents
                        )
                        // tap((message) => console.log("WS MESSAGE", message)),
                    )
                    return spawn(observable)
                },
            }),

            openPeerConnection: immerAssign(
                (context: ICEContext, event: ICEEvents) => {
                    // ! We're ignoring the configuration sent by the machine
                    // ! and instead use the peerConnection parameters received by the matchmaker
                    // const options: RTCConfiguration = (event as ConfigMessage).peerConnectionOptions
                    const options: RTCConfiguration =
                        context.peerConnectionParameters

                    // const regex = new RegExp('"credential\\:"', 'ig')
                    // const unsanitized = JSON.stringify(options, null, 4)
                    // const sanitized = unsanitized.replace(regex, '"credential":"****"')
                    const sanitizedIceServers = options.iceServers!.map(
                        (iceServer) => ({
                            ...iceServer,
                            credential: '****',
                        })
                    )
                    const sanitizedOptions = {
                        ...options,
                        iceServers: sanitizedIceServers,
                    }
                    console.debug(
                        `Opening peerConnection: ${JSON.stringify(
                            sanitizedOptions
                        )}`
                    )

                    const peerConnection = new RTCPeerConnection({
                        ...defaultPeerConnectionOptions(),
                        ...options,
                    })

                    const datachannelOptions = { ordered: true }
                    const label = 'monkey'
                    const dataChannel: RTCDataChannel =
                        peerConnection.createDataChannel(
                            label,
                            datachannelOptions
                        )

                    context.peerConnection = peerConnection
                    context.dataChannel = dataChannel
                }
            ),

            spawnPeerConnectionListener: assign({
                peerConnectionListener: (context) =>
                    spawn(
                        PeerConnectionListener(context.peerConnection!),
                        'peer-connection-listener'
                    ),
            }),

            stopWebsocketListener: actions.stop(
                (context: ICEContext) => context.webSocketListener!
            ),
            stopPeerConnectionListener: actions.stop(
                (context: ICEContext) => context.peerConnectionListener!
            ),
        },
    })
}
