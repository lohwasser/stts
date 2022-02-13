import { Observable, type Subscriber } from 'rxjs'
import type { WebRTCState } from 'src/domain/webrtc'
import { send, sendParent, spawn } from 'xstate'
import { assign as immerAssign } from '@xstate/immer'
import type { PeerConnectionContext } from './peer-connection.machine'

import listener from './peer-connection.listener'
import { SignalingEventType } from '../signaling/signaling.events'
import type { PeerConnectionEvents } from './peer-connection.events'

export default {
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
        context.peerConnection.setLocalDescription(offer)
            // .then(() => console.log("OK setLocalDescription"))
            .catch((error: unknown) => console.error("ERROR setLocalDescription", error))
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

        return { type: SignalingEventType.Offer, sdp: modifiedSdp }
    })

    sendICECandidateToParent: sendParent((context: PeerConnectionContext, event: PeerConnectionEvents) => {

        return { type: SignalingEventType.Offer, sdp: modifiedSdp }
    })

}


