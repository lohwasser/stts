// An observable that listens to the RTCPeerConnection.

import { Observable, type Subscriber } from 'rxjs'
import {
    type PeerConnectionEvents,
    PeerConnectionEventType,
} from 'src/domain/webrtc.events'
import type { WebRTCState } from 'src/domain/webrtc.types'

// It emits an IceEvent whenever we receive a message.
export default (
    peerConnection: RTCPeerConnection
): Observable<PeerConnectionEvents> =>
    new Observable<PeerConnectionEvents>(
        (observer: Subscriber<PeerConnectionEvents>) => {
            // console.info("ice: Start listening to the peer connection")

            peerConnection.onsignalingstatechange = (event: Event) => {
                // console.log("ice — onsignalingstatechange")
                observer.next({
                    type: PeerConnectionEventType.StateChange,
                    state: calculateState(event.target as RTCPeerConnection),
                })
            }

            peerConnection.oniceconnectionstatechange = (event: Event) => {
                // console.log("ice — oniceconnectionstatechange")
                observer.next({
                    type: PeerConnectionEventType.StateChange,
                    state: calculateState(event.target as RTCPeerConnection),
                })
            }

            peerConnection.onicegatheringstatechange = (event: Event) => {
                // console.log("ice — onnegotiationneeded")
                observer.next({
                    type: PeerConnectionEventType.StateChange,
                    state: calculateState(event.target as RTCPeerConnection),
                })
            }

            peerConnection.onnegotiationneeded = (event: Event) => {
                // console.log("ice — onnegotiationneeded")
                observer.next({
                    type: PeerConnectionEventType.StateChange,
                    state: calculateState(event.target as RTCPeerConnection),
                })
            }

            peerConnection.onconnectionstatechange = (event: Event) => {
                // console.log("onconnectionstatechange", event)
                // console.log("ice — onconnectionstatechange")
                observer.next({
                    type: PeerConnectionEventType.StateChange,
                    state: calculateState(event.target as RTCPeerConnection),
                })
            }

            peerConnection.onicecandidate = (
                event: RTCPeerConnectionIceEvent
            ) => {
                const { candidate } = event
                // sometimes onicecandidate doesn't actually contain an ice candidate
                if (candidate !== null && candidate.candidate !== '') {
                    // console.log("ice — onicecandidate")
                    observer.next({
                        type: PeerConnectionEventType.IceCandidate,
                        candidate,
                    })
                }
                // else console.info(`Ignore faulty iceCandidate: ${JSON.stringify(event)}`)
            }

            peerConnection.ontrack = (trackEvent: RTCTrackEvent) => {
                // console.log("ice — ontrack")
                observer.next({
                    type: PeerConnectionEventType.Track,
                    event: trackEvent,
                })
            }

            // peerConnection.onicecandidateerror = (event: RTCPeerConnectionIceErrorEvent) => {
            //     observer.next({
            //         type: IceEventType.Ice_CANDIDATE_ERROR,
            //         error: event,
            //     })
            // }

            // peerConnection.onstatsended = (event: RTCStatsEvent) => {}

            // eslint-disable-next-line @typescript-eslint/no-empty-function
            return function cleanup() {}
        }
    )
// .pipe(tap((event) => console.debug(`← PC: ${event.type}`))),

const calculateState = (peerConnection: RTCPeerConnection): WebRTCState => ({
    connectionState: peerConnection.connectionState,
    iceConnectionState: peerConnection.iceConnectionState,
    iceGatheringState: peerConnection.iceGatheringState,
    signalingState: peerConnection.signalingState,
})
