import axios from 'axios'
import type { MatchmakingResponse } from './connection.events'
import type { ConnectionContext } from './connection.machine'

export default {
    queryMatchmaker: async (
        context: ConnectionContext
    ): Promise<MatchmakingResponse> => {
        const url: URL = context.matchmakingUrl
        const urlString = url.toString()

        // GET query with double promise
        return await (
            await axios.get(urlString)
        ).data
    },
}
