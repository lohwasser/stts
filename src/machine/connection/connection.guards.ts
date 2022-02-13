import type { ConnectionEvents, MatchmakingResponse } from './connection.events'
import type { ConnectionContext } from './connection.machine'

export default {
    matchmakingOk: (_context: ConnectionContext, event: ConnectionEvents) =>
        event.type === 'matchmaking_ok',
}
