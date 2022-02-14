import { assign, sendParent, spawn } from 'xstate'
import { assign as immerAssign } from '@xstate/immer'
import type { PeerConnectionContext } from './peer-connection.machine'

import listener from './peer-connection.listener'
import {
    PeerConnectionEventType,
    type PeerConnectionEvents,
} from './peer-connection.events'
import {
    IceEventType,
    type Answer,
    type SignalingIceCandidate,
    type SignalingServerEvents,
    type StateChange,
} from 'src/domain/webrtc.events'

export default {
    sendToParent: sendParent(
        (_c: PeerConnectionContext, event: PeerConnectionEvents) => event
    ),

    spawnPeerConnectionListener: immerAssign(
        (context: PeerConnectionContext) =>
            (context.listener = spawn(
                listener(context.peerConnection),
                'listener'
            ))
    ),

    setLocalDescription: (context: PeerConnectionContext, event: any) => {
        const offer: RTCSessionDescription = event.data
        // console.log("peerConnection.setLocalDescription", offer)
        // * Note: Calling an async function (setLocalDescription returns a promise)
        // * without caring for the answer.
        // From a purely systematic point of view this should be
        // a service rather than an action. (because it returns a result)
        // But as we're not relay interested in the answer, we call an action,
        // thus sparing ourselves the complexity of creating a separate state for
        // each service-invocation.
        context.peerConnection
            .setLocalDescription(offer)
            // .then(() => console.log("OK setLocalDescription"))
            .catch((error: unknown) =>
                console.error('ERROR setLocalDescription', error)
            )
    },

    setRemoteDescription: (
        context: PeerConnectionContext,
        event: PeerConnectionEvents
    ) => {
        const message = event as Answer
        console.debug('peerConnection.setRemoteDescription', message)
        const description = new RTCSessionDescription(message)

        context.peerConnection
            .setRemoteDescription(description)
            // .then(() => console.log("OK setRemoteDescription"))
            .catch((error) =>
                console.error('ERROR setRemoteDescription', error)
            )
    },

    updateState: immerAssign(
        (context: PeerConnectionContext, event: PeerConnectionEvents) => {
            const { state } = event as StateChange
            // console.log("setWebRTCState", JSON.stringify(webRTCState))
            context.webRTCState = state
        }
    ),

    addIceCandidate: (
        context: PeerConnectionContext,
        event: SignalingServerEvents
    ) => {
        const candidate: RTCIceCandidate = (event as SignalingIceCandidate)
            .candidate
        context.peerConnection
            .addIceCandidate(candidate)
            .then(() => console.debug('OK addIceCandidate'))
            .catch((error) => console.error('ERROR addIceCandidate', error))
    },

    sendOfferToParent: sendParent((_c: PeerConnectionContext, event: any) => {
        const offer: RTCSessionDescription = event.data

        // <Hack>

        // ██╗███╗   ███╗██████╗  ██████╗ ██████╗ ████████╗ █████╗ ███╗   ██╗████████╗    ██╗  ██╗ █████╗  ██████╗██╗  ██╗
        // ██║████╗ ████║██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔══██╗████╗  ██║╚══██╔══╝    ██║  ██║██╔══██╗██╔════╝██║ ██╔╝
        // ██║██╔████╔██║██████╔╝██║   ██║██████╔╝   ██║   ███████║██╔██╗ ██║   ██║       ███████║███████║██║     █████╔╝
        // ██║██║╚██╔╝██║██╔═══╝ ██║   ██║██╔══██╗   ██║   ██╔══██║██║╚██╗██║   ██║       ██╔══██║██╔══██║██║     ██╔═██╗
        // ██║██║ ╚═╝ ██║██║     ╚██████╔╝██║  ██║   ██║   ██║  ██║██║ ╚████║   ██║       ██║  ██║██║  ██║╚██████╗██║  ██╗
        // ╚═╝╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝       ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝

        // ***************
        // * DO NOT TOUCH!
        // ***************

        // ! If we don't modify the SDP, video.onmetadataloaded won't get called.
        // ! I don't know why this is so.

        // From the original `WebsocketWebServer.webrtcPlayer.handleCreateOffer()` code:
        // "  (andriy): increase start bitrate from 300 kbps to 20 mbps and max bitrate from 2.5 mbps to 100 mbps
        //    (100 mbps means we don't restrict encoder at all)
        //    after we `setLocalDescription` because other browsers are not c happy to see google-specific config
        // "

        const modifiedSdp = offer.sdp.replace(
            /(a=fmtp:\d+ .*level-asymmetry-allowed=.*)\r\n/gm,
            '$1;x-google-start-bitrate=10000;x-google-max-bitrate=20000\r\n'
        )
        // </Hack>

        return { type: IceEventType.Offer, sdp: modifiedSdp }
    }),

    // after the peer connection has been established, we're passing it to the
    // parent machine
    sendPeerConnectionToParent: sendParent(
        (context: PeerConnectionContext) => ({
            type: PeerConnectionEventType.Ready,
            connection: context.peerConnection,
        })
    ),
}
