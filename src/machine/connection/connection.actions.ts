import axios from 'axios'
import { assign, spawn } from 'xstate'
import { assign as immerAssign } from '@xstate/immer'
import { makeICEMachine } from '../ice/ice.machine'
import type {
    ConnectionEvents,
    MatchmakingOk,
    MatchmakingResponse,
} from './connection.events'
import type { ConnectionContext } from './connection.machine'
import { makeSignalingMachine } from '../signaling/signaling.machine'

export default {
    /**
     * Send a GET request to to the [[matchmakingUrl]].
     * In response we receive either a [[MatchmakingResponse]],
     * or a [[NoInstanceError]].
     *
     * The [[MatchmakingResponse]] tells us to which Websocket to connect to
     * and which STUN/TURN configuration (PeerConnectionParameters) to use.
     * The [[NoInstanceError]] tells us that there is currently no unreal engine available.
     */
    queryMatchmaker: async (
        context: ConnectionContext
    ): Promise<MatchmakingResponse> => {
        const url: URL = context.matchmakingUrl
        const urlString = url.toString()

        // GET query with double! promise
        return (await (
            await axios.get(urlString)
        ).data) as MatchmakingResponse
    },

    spawnSignalingMachine: immerAssign(
        (context: ConnectionContext, event: ConnectionEvents) => {
            const { unrealMachineId, peerConnectionParameters } =
                event as MatchmakingOk
            const machine = makeSignalingMachine({
                url: context.signalingUrl,
                unrealId: unrealMachineId,
                rtcConfiguration: peerConnectionParameters,
            })
            context.signalingMachine = spawn(machine, 'signaling')
        }
    ),

    openPeerConnection: immerAssign(
        (context: ConnectionContext, event: ConnectionEvents) => {
            // ! We're ignoring the configuration sent by the machine
            // ! and instead use the peerConnection parameters received by the matchmaker
            // const options: RTCConfiguration = (event as ConfigMessage).peerConnectionOptions
            const options: RTCConfiguration = context.peerConnectionParameters

            // const regex = new RegExp('"credential\\:"', 'ig')
            // const unsanitized = JSON.stringify(options, null, 4)
            // const sanitized = unsanitized.replace(regex, '"credential":"****"')
            const sanitizedIceServers = options.iceServers.map((iceServer) => ({
                ...iceServer,
                credential: '****',
            }))
            const sanitizedOptions = {
                ...options,
                iceServers: sanitizedIceServers,
            }
            console.debug(
                `Opening peerConnection: ${JSON.stringify(sanitizedOptions)}`
            )

            const peerConnection = new RTCPeerConnection({
                ...defaultPeerConnectionOptions(),
                ...options,
            })

            const datachannelOptions = { ordered: true }
            const label = 'monkey'
            const dataChannel: RTCDataChannel =
                peerConnection.createDataChannel(label, datachannelOptions)

            context.peerConnection = peerConnection
            context.dataChannel = dataChannel
        }
    ),

    spawnIceMachine: immerAssign(
        (context: ConnectionContext, event: ConnectionEvents) => {
            console.debug('Spawn iceMachine')
            const { peerConnectionParameters } = event as MatchmakingOk
            const sdpConstraints = {
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
            }
            const machine = makeICEMachine(
                context.webSocket!,
                peerConnectionParameters,
                sdpConstraints
            )
            context.iceMachine = spawn(machine, 'ice')
        }
    ),
}
