import { assign, send, sendParent, spawn } from 'xstate'
import { assign as immerAssign } from '@xstate/immer'

import type { ICEContext } from './ice.machine'
import { fromEvent, map, tap } from 'rxjs'
import type {
    Answer,
    SignalingEvents,
    SignalingIceCandidate,
    Offer,
} from 'src/machine/signaling/signaling.events'
import type { ICECandidate, ICEEvents, ICEStateChange } from './ice.events'

const websocketActions = {
    setWebRTCState: assign({
        webRTCState: (_context, event: ICEEvents) => {
            const { state } = event as ICEStateChange
            return state
        },
    }),

    relayToParent: sendParent((_context, event: ICEEvents) => event),

    sendConnectionsToParent: sendParent((context: ICEContext) => ({
        type: 'ice_connections',
        peerConnection: context.peerConnection,
        dataChannel: context.dataChannel,
    })),

    sendDoneToParent: sendParent(() => ({ type: 'ice_done' })),

    sendErrorToParent: sendParent((_context, error: ICEEvents) => error),

    sendOfferToServer: (context: ICEContext, event: any) => {
        const offer: RTCSessionDescription = event.data

        // <HackedyHack>
        // ██╗███╗   ███╗██████╗  ██████╗ ██████╗ ████████╗ █████╗ ███╗   ██╗████████╗    ██╗  ██╗ █████╗  ██████╗██╗  ██╗
        // ██║████╗ ████║██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔══██╗████╗  ██║╚══██╔══╝    ██║  ██║██╔══██╗██╔════╝██║ ██╔╝
        // ██║██╔████╔██║██████╔╝██║   ██║██████╔╝   ██║   ███████║██╔██╗ ██║   ██║       ███████║███████║██║     █████╔╝
        // ██║██║╚██╔╝██║██╔═══╝ ██║   ██║██╔══██╗   ██║   ██╔══██║██║╚██╗██║   ██║       ██╔══██║██╔══██║██║     ██╔═██╗
        // ██║██║ ╚═╝ ██║██║     ╚██████╔╝██║  ██║   ██║   ██║  ██║██║ ╚████║   ██║       ██║  ██║██║  ██║╚██████╗██║  ██╗
        // ╚═╝╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝       ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝

        // ***************
        // * DO NOT TOUCH!
        // ***************

        // From WebsocketWebServer.webrtcPlayer.handleCreateOffer():
        // "  (andriy): increase start bitrate from 300 kbps to 20 mbps and max bitrate from 2.5 mbps to 100 mbps
        //    (100 mbps means we don't restrict encoder at all)
        //    after we `setLocalDescription` because other browsers are not c happy to see google-specific config
        // "
        // If we don't modify the SDP, video.onmetadataloaded won't get called.
        // I don't know why.

        const modifiedSdp = offer.sdp.replace(
            /(a=fmtp:\d+ .*level-asymmetry-allowed=.*)\r\n/gm,
            '$1;x-google-start-bitrate=10000;x-google-max-bitrate=20000\r\n'
        )
        // </HackedyHack>

        const message: Offer = {
            type: 'signaling_offer',
            sdp: modifiedSdp,
        }
        // console.log('⇨ WS: offer', message)
        context.websocket!.send(JSON.stringify(message))
    },

    sendICECandidateToServer: (context: ICEContext, event: any) => {
        const { candidate } = event as ICECandidate
        const message: SignalingIceCandidate = {
            type: 'signaling_ice_candidate',
            candidate,
        }
        // console.log('⇨ WS: iceCandidate', message)
        context.websocket!.send(JSON.stringify(message))
    },

    setLocalDescription: (context: ICEContext, event: any) => {
        const offer: RTCSessionDescription = event.data
        // console.log("peerConnection.setLocalDescription", offer)
        // * Note: Calling an async function (setLocalDescription returns a promise)
        // * without caring for the answer.
        // From a purely systematic point of view this should be
        // a service rather than an action. (because it returns a result)
        // But as we're not really interested in the answer, we call an action,
        // thus sparing ourselves the complexity of creating a separate state for
        // each service-invocation.
        context
            .peerConnection!.setLocalDescription(offer)
            // .then(() => console.log("OK setLocalDescription"))
            .catch((error) => console.error('ERROR setLocalDescription', error))
    },

    setRemoteDescription: (context: ICEContext, event: ICEEvents) => {
        const message = event as Answer
        // console.log("peerConnection.setRemoteDescription", message)
        const description = new RTCSessionDescription(message)

        context
            .peerConnection!.setRemoteDescription(description)
            // .then(() => console.log("OK setRemoteDescription"))
            .catch((error) =>
                console.error('ERROR setRemoteDescription', error)
            )
    },

    addIceCandidate: (context: ICEContext, event: ICEEvents) => {
        const { candidate } = event as ICECandidate
        context
            .peerConnection!.addIceCandidate(candidate)
            // .then(() => console.log("OK addIceCandidate"))
            .catch((error) => console.error('ERROR addIceCandidate', error))
    },
}

export default websocketActions
