import {
    type MachineConfig,
    createMachine,
    type ActorRef,
} from 'xstate'
import { IceEventType, type IceEvents, type PeerConnectionEvents } from './peer-connection.events'

import actions from "./peer-connection.actions"
import services from "./peer-connection.services"

export type PeerConnectionContext = {
    sdpConstraints: RTCOfferOptions
    peerConnection: RTCPeerConnection
    listener?: ActorRef<IceEvents>
}

export type PeerConnectionStateSchema = {
    states: {
        offer: {}
        gathering: {}
        done: {}
        error: {}
    }
}

const machineConfig = (
    options: RTCConfiguration
): MachineConfig<
    PeerConnectionContext,
    PeerConnectionStateSchema,
    PeerConnectionEvents
> => ({
    id: 'websocket-client',
    schema: {
        context: {} as PeerConnectionContext,
        events: {} as PeerConnectionEvents,
    },
    context: {
        peerConnection: openPeerConnection(options),
        listener: undefined,
        sdpConstraints: {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        },
    },
    entry: ['spawnListener'],
    initial: 'offer',
    states: {
        offer: {
            invoke: {
                src: "createSessionDescription",
                onDone: {
                    actions: ["setLocalDescription", "sendOfferToParent"],
                    target: 'gathering'
                },
            },
        },
        gathering: {
            on: {
                [IceEventType.Candidate]: { actions: "sendICECandidateToParent" },
                [IceEventType.StateChange]: [
                    {
                        actions: "setWebRTCState",
                        target: "connected",
                        cond: "finished",
                    },
                    {
                        actions: "setWebRTCState",
                    },
                ],
            },
        },

        done: {
            type: 'final',
        },

        error: {
            type: 'final',
        },
    },

    on: {
        // default
        '*': {
            actions: (_c, event) =>
                console.warn('Unexpected Websocket event:', { event }),
        },
    },
})

export const makePeerConnectionMachine = (options: RTCConfiguration) =>
    createMachine<PeerConnectionContext, PeerConnectionEvents>(
        machineConfig(options),
        { actions, services }
    )

// HELPERS
// ———————

const defaultOptions = {
    sdpSemantics: 'unified-plan',

    // Quote: "possible fix for WebRTC Chrome 89 issues"
    // Whatever this might mean.
    offerExtmapAllowMixed: false,
}

const openPeerConnection = (options: RTCConfiguration): RTCPeerConnection => {
    // const regex = new RegExp('"credential\\:"', 'ig')
    // const unsanitized = JSON.stringify(options, null, 4)
    // const sanitized = unsanitized.replace(regex, '"credential":"****"')
    const sanitizedIceServers = options.iceServers?.map((iceServer) => ({
        ...iceServer,
        credential: '****',
    }))
    const sanitizedOptions = { ...options, iceServers: sanitizedIceServers }
    console.debug(`Opening peerConnection: ${JSON.stringify(sanitizedOptions)}`)

    return new RTCPeerConnection({
        ...defaultOptions,
        ...options,
    })
}
