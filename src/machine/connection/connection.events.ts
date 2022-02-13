import type { WebSocketClientEvents } from 'fsm/src/machines/websocket-client/websocket-client.events'
import type { UnrealMachineId } from 'src/domain/unreal'
import type { PeerConnectionParameters } from 'src/domain/webrtc'
import type { ICEEvents } from '../ice/ice.events'

export type MatchmakingOk = {
    type: 'matchmaking_ok'
    unrealMachineId: UnrealMachineId
    peerConnectionParameters: PeerConnectionParameters
}

export type MatchmakingNoInstance = {
    type: 'matchmaking_no_instance'
}

export type MatchmakingResponse = MatchmakingOk | MatchmakingNoInstance

export type ConnectionEvents =
    | MatchmakingResponse
    | WebSocketClientEvents
    | ICEEvents
