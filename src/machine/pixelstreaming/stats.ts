import { VideoStats, WebRTCEventType, WebRTCStats } from '$lib/domain/webrtc'
import { Observable, Subscriber } from 'rxjs'

export const collectStats = (
    peerConnection: RTCPeerConnection,
    interval: number
): Observable<WebRTCStats> =>
    new Observable<WebRTCStats>((observer: Subscriber<WebRTCStats>) => {
        console.info('PeerConnection: Start collecting webRTC-statistics')

        const getStats = (): void => {
            peerConnection.getStats(null).then((stats: RTCStatsReport) => {
                stats.forEach((stat) => {
                    // if (stat.type == 'inbound-rtp') {
                    //     console.log(stat)
                    // }

                    if (
                        stat.type == 'inbound-rtp' &&
                        !stat.isRemote &&
                        (stat.mediaType == 'video' ||
                            stat.id.toLowerCase().includes('video'))
                    ) {
                        const stats: Partial<VideoStats> = {
                            timestamp: stat.timestamp,
                            bytesReceived: stat.bytesReceived,
                            framesDecoded: stat.framesDecoded,
                            packetsLost: stat.packetsLost,
                        }
                        observer.next({
                            type: WebRTCEventType.WebRtcStats,
                            stats,
                        })

                        // {
                        //   id: "RTCInboundRTPVideoStream_2961291979",
                        //   timestamp: 1619456515762.109,
                        //   type: "inbound-rtp",
                        //   ssrc: 2961291979,
                        //   isRemote: false,
                        //   mediaType: "video",
                        //   kind: "video",
                        //   trackId: "RTCMediaStreamTrack_receiver_2",
                        //   transportId: "RTCTransport_0_1",
                        //   codecId: "RTCCodec_1_Inbound_125",
                        //   firCount: 0,
                        //   pliCount: 11,
                        //   nackCount: 0,
                        //   qpSum: 1680,
                        //   packetsReceived: 560,
                        //   bytesReceived: 599070,
                        //   headerBytesReceived: 14048,
                        //   packetsLost: 0,
                        //   lastPacketReceivedTimestamp: 25917.355,
                        //   framesDecoded: 84,
                        //   keyFramesDecoded: 2,
                        //   totalDecodeTime: 0.338,
                        //   totalInterFrameDelay: 12.230000000000002,
                        //   totalSquaredInterFrameDelay: 1.8196439999999985,
                        //   estimatedPlayoutTimestamp: 3828445315228,
                        //   decoderImplementation: "FFmpeg"
                        // }
                    }

                    //Read video track stats
                    if (
                        stat.type == 'track' &&
                        (stat.trackIdentifier == 'video_label' ||
                            stat.kind == 'video')
                    ) {
                        const stats: Partial<VideoStats> = {
                            timestamp: stat.timestamp,
                            framesDropped: stat.framesDropped,
                            framesReceived: stat.framesReceived,
                            videoResolution: new Vector2(
                                stat.frameWidth,
                                stat.frameHeight
                            ),
                        }
                        observer.next({
                            type: WebRTCEventType.WebRtcStats,
                            stats,
                        })
                        // {
                        //     id: "RTCMediaStreamTrack_receiver_6",
                        //     timestamp: 1619457146472.654,
                        //     type: "track",
                        //     trackIdentifier: "1b579166-163a-413a-80c6-98dabe3637bd",
                        //     remoteSource: true,
                        //     ended: false,
                        //     detached: false,
                        //     kind: "video",
                        //     jitterBufferDelay: 0,
                        //     jitterBufferEmittedCount: 0,
                        //     framesReceived: 0,
                        //     framesDecoded: 0,
                        //     framesDropped: 0
                        // }
                    }

                    // if (stat.type == 'candidate-pair') {
                    //     const stats: PartialWebRTCStats = {
                    //         timestamp: stat.timestamp,
                    //         currentRoundTripTime: stat.currentRoundTripTime,
                    //     }
                    //     observer.next({ type: PeerConnectionEventType.WebRtcStats, stats })
                    //     // {
                    //     //   id: "RTCIceCandidatePair_w3u66VkN_A8f/yHj+",
                    //     //   timestamp: 1619451550092.306,
                    //     //   type: "candidate-pair",
                    //     //   transportId: "RTCTransport_0_1",
                    //     //   localCandidateId: "RTCIceCandidate_w3u66VkN",
                    //     //   remoteCandidateId: "RTCIceCandidate_A8f/yHj+",
                    //     //   state: "succeeded",
                    //     //   priority: 144149272013454850,
                    //     //   nominated: true,
                    //     //   writable: true,
                    //     //   bytesSent: 1707072,
                    //     //   bytesReceived: 77192379,
                    //     //   totalRoundTripTime: 23.671,
                    //     //   currentRoundTripTime: 0.03,
                    //     //   availableOutgoingBitrate: 300000,
                    //     //   requestsReceived: 727,
                    //     //   requestsSent: 1,
                    //     //   responsesReceived: 727,
                    //     //   responsesSent: 727,
                    //     //   consentRequestsSent: 726
                    //     // }
                    // }
                })
            })
        }

        setInterval(getStats, interval)

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return function cleanup() {}
    })
