import type { WebSocketClientEvents } from 'fsm/src/machines/websocket-client/websocket-client.events'
import type { UnrealMachineId } from 'src/domain/unreal'
import type { PeerConnectionParameters } from 'src/domain/webrtc.types'
import type { PeerConnectionEvents } from '../peer-connection/peer-connection.events'

export type SignalingEvents =
    | PeerConnectionEvents
    | WebSocketClientEvents
    | MatchmakingResponse

export type MatchmakingResponse = MatchmakingOk | MatchmakingNoInstance

export type MatchmakingOk = {
    type: 'matchmaking_ok'
    unrealId: UnrealMachineId
    peerConnectionParameters: PeerConnectionParameters
}

export type MatchmakingNoInstance = {
    type: 'matchmaking_no_instance'
}
