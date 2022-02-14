import type { ConnectionEvents } from './connection.events'
import type { ConnectionContext } from './connection.machine'

export default {
    matchmakingOk: (_context: ConnectionContext, event: ConnectionEvents) =>
        event.type === 'matchmaking_ok',
}
