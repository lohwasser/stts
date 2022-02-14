import type { UnrealMachineId } from 'src/domain/unreal'
import type { PeerConnectionParameters } from 'src/domain/webrtc.types'
import type { SignalingEvents } from '../signaling/signaling.events'

export type MatchmakingOk = {
    type: 'matchmaking_ok'
    unrealMachineId: UnrealMachineId
    peerConnectionParameters: PeerConnectionParameters
}

export type MatchmakingNoInstance = {
    type: 'matchmaking_no_instance'
}

export type MatchmakingResponse = MatchmakingOk | MatchmakingNoInstance

export type ConnectionEvents = MatchmakingResponse | SignalingEvents
