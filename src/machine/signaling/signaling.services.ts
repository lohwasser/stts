import axios from 'axios'
import type { MatchmakingResponse } from '../connection/connection.events'
import type { SignalingContext } from './signaling.machine'

export default {
    queryMatchmaker: async (
        context: SignalingContext
    ): Promise<MatchmakingResponse> => {
        const url: URL = context.matchmakingUrl
        const urlString = url.toString()

        // GET query with double promise
        return await (
            await axios.get(urlString)
        ).data
    },
}
