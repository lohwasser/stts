import type { InputEvents } from '../input/input.events'
import type { SignalingEvents } from '../signaling/signaling.events'
import type { VideoEvent } from './video.event'

export type MainEvents =
    | PixelstreamingCommand
    | SignalingEvents
    | InputEvents
    | VideoEvent

export type PixelstreamingCommand =
    | InitializePixelstreaming
    | PlayPixelstreaming
    | ResetPixelstreaming

export enum PixelstreamingCommandType {
    Initialize = 'pixelstreaming_initialize',
    Play = 'pixelstreaming_play',
    Reset = 'pixelstreaming_reset',
}

export type InitializePixelstreaming = {
    type: PixelstreamingCommandType.Initialize
    videoElement: HTMLVideoElement
}

export type PlayPixelstreaming = {
    type: PixelstreamingCommandType.Play
}

export type ResetPixelstreaming = {
    type: PixelstreamingCommandType.Reset
}
