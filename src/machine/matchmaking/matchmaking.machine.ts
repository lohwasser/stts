import type { ActorRef, MachineConfig } from 'xstate'
import type { SignalingEvents } from '../signaling/signaling.events'
import {
    initialWebRTCState,
    type PeerConnectionParameters,
    type WebRTCState,
    type WebRTCStats,
} from '../../domain/webrtc'
import type { MatchmakingEvents } from './matchmaking.events'

import { createMachine } from 'xstate'
import actions from './matchmaking.actions'
import services from './matchmaking.services'
import guards from './matchmaking.guards'

// Interactive Connectivity Establishment
export type MatchmakingContext = {
    sdpConstraints: RTCOfferOptions
    peerConnectionParameters: PeerConnectionParameters
    webRTCState: WebRTCState

    peerConnection?: RTCPeerConnection
    dataChannel?: RTCDataChannel
    peerConnectionListener?: ActorRef<MatchmakingEvents>
    websocket?: WebSocket
    websocketListener?: ActorRef<SignalingEvents>
    statsCollector?: ActorRef<WebRTCStats>
    // dataChannelActor: ActorRefFrom<DataChannelMachine>
}

export interface MatchmakingStateSchema {
    states: {
        websocket: {}
        offer: {}
        gathering: {}
        // gatheringComplete: {}
        // stable: {}
        connected: {}
        error: {}
    }
}

const iceMachineConfig = (
    peerConnectionParameters: PeerConnectionParameters
): MachineConfig<
    MatchmakingContext,
    MatchmakingStateSchema,
    MatchmakingEvents
> => ({
    schema: {
        context: {} as MatchmakingContext,
        events: {} as MatchmakingEvents,
    },

    context: {
        peerConnectionParameters,
        sdpConstraints: {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        },
        webRTCState: initialWebRTCState(),

        dataChannel: undefined,
        peerConnection: undefined,
        peerConnectionListener: undefined,
        statsCollector: undefined,
        websocket: undefined,
        websocketListener: undefined,
    },

    on: {
        ice_track: { actions: 'relayToParent' },
        // received from the signaling server
        signaling_player_count: {}, // ignore
        signaling_answer: { actions: 'setRemoteDescription' },
        signaling_ice_candidate: { actions: 'addIceCandidate' },
    },
    initial: 'websocket',
    states: {
        websocket: {
            entry: 'spawnWebsocketListener',
            on: {
                // the first message we expect to receive from the signaling-server
                // are the PeerConnectionOptions
                'signaling_configuration': {
                    actions: 'openPeerConnection',
                    target: 'offer',
                },
                '*': {
                    actions: (c, event) =>
                        console.log('Matchmaking openWebsocket:', event),
                },
            },
        },

        offer: {
            entry: ['spawnPeerConnectionListener'],
            invoke: {
                src: 'createWebRtcOffer',
                onDone: {
                    actions: ['setLocalDescription', 'sendOfferToServer'],
                    target: 'gathering',
                },
            },
        },

        gathering: {
            entry: () => console.info('ice — iceGathering'),
            on: {
                ice_candidate: { actions: 'sendMatchmakingCandidateToServer' },
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

        connected: {
            entry: [() => console.info('connected'), 'sendConnectionsToParent'],
            type: 'final',
        },

        error: {
            entry: 'sendErrorToParent',
            type: 'final',
        },
    },
})

export const makeMatchmakingMachine = (
    peerConnectionParameters: PeerConnectionParameters
) => {
    const configuration = iceMachineConfig(peerConnectionParameters)
    return createMachine<MatchmakingContext, MatchmakingEvents>(configuration, {
        actions: actions,
        services: services,
        guards: guards,
    })
}
