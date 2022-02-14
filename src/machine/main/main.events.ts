import type { IceTrack } from 'src/domain/webrtc.events'
import type { MainContext } from './main.machine'

export type MainEvents = PixelstreamingCommand | IceTrack

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
