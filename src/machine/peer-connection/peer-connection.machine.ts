import { IceEventType, type IceEvents } from 'src/domain/ice.events'
import { type MachineConfig, createMachine, type ActorRef } from 'xstate'
import type { WebRTCState } from 'src/domain/webrtc'

import type { PeerConnectionEvents } from './peer-connection.events'
import actions from './peer-connection.actions'
import services from './peer-connection.services'
import guards from './peer-connection.guards'
import { SignalingEventType } from '../signaling/signaling.events'

export type PeerConnectionContext = {
    sdpConstraints: RTCOfferOptions
    peerConnection: RTCPeerConnection
    listener?: ActorRef<IceEvents>

    // current connection-state
    webRTCState: WebRTCState
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
        webRTCState: {
            connectionState: 'new',
            iceConnectionState: 'new',
            iceGatheringState: 'new',
            signalingState: 'closed',
        },
    },
    entry: ['spawnListener'],
    initial: 'offer',
    states: {
        offer: {
            invoke: {
                src: 'createSessionDescription',
                onDone: {
                    actions: ['setLocalDescription', 'sendOfferToParent'],
                    target: 'gathering',
                },
                on: {
                    [SignalingEventType.Offer]: { 
                        actions: 
                    },
                },
            },
        },
        gathering: {
            on: {
                [IceEventType.Candidate]: { actions: 'sendToParent' },
                [IceEventType.StateChange]: [
                    {
                        actions: 'webRTCState',
                        // If the connection has been established, we're done
                        cond: 'connectionEstablished',
                        target: 'done',
                    },
                    {
                        // If the connection has not yet been established, 
                        // we'll just update the webRTCstate and wait for more events
                        actions: 'webRTCState',
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
        { actions, services, guards },
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
