import axios from 'axios'
import { spawn } from 'xstate'
import { assign as immerAssign } from '@xstate/immer'
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
}
