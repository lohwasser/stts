import { type MachineConfig, createMachine, type ActorRef } from 'xstate'
import type { WebRTCState } from 'src/domain/webrtc.types'

import actions from './peer-connection.actions'
import services from './peer-connection.services'
import guards from './peer-connection.guards'
import type { PeerConnectionEvents } from './peer-connection.events'
import { IceEventType, SignalingServerEventType } from 'src/domain/webrtc.events'

export type PeerConnectionContext = {
    sdpConstraints: RTCOfferOptions
    peerConnection: RTCPeerConnection
    listener?: ActorRef<PeerConnectionEvents>

    // current connection-state
    webRTCState: WebRTCState
}

export type PeerConnectionStateSchema = {
    states: {
        connecting: {}
        ready: {}
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
    initial: 'connecting',
    states: {
        connecting: {
            // the first thing we're doing is create an SDP 'offer'
            invoke: {
                src: 'createSessionDescription',

                // after the offer has been created, we
                //  1. set it as our local description
                //  2. send it to the signaling server
                onDone: {
                    actions: ['setLocalDescription', 'sendOfferToParent'],
                },
            },
            on: {
                // Events sent by the peer connection
                [IceEventType.IceCandidate]: {
                    actions: 'sendToParent',
                },
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
                        actions: 'updateState',
                    },
                ],

                // Events sent by the signaling-server (handed down via parent machine)
                [SignalingServerEventType.Answer]: {
                    actions: 'setRemoteDescription',
                },
                [SignalingServerEventType.IceCandidate]: {
                    actions: 'addIceCandidate',
                },
            },
        },

        ready: {
            type: 'final',
            entry: 'sendPeerConnectionToParent',
        },

        error: {
            type: 'final',
            entry: 'sendToParent',
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
    createMachine<PeerConnectionContext, PeerConnectionEvents>(machineConfig(options), {
        actions,
        services,
        guards,
    })

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
