import type { VideoEvent } from './video.event'
import type { PixelstreamingError } from './errors'
import type { ICEEvents } from '../ice/ice.events'
import type { SignalingEvents } from 'src/machine/signaling/signaling.events'

export enum PixelstreamingCommandType {
    Initialize = 'INITIALIZE_PIXELSTREAMING',
    Play = 'PLAY_PIXELSTREAMING',
    // Pause = "PAUSE_PIXELSTREAMING",
    Reset = 'RESET_PIXELSTREAMING',
}

export type InitializePixelstreaming = {
    type: PixelstreamingCommandType.Initialize
    playerElement: HTMLVideoElement
}

export type PlayPixelstreaming = {
    type: PixelstreamingCommandType.Play
}

// export type PausePixelstreamingEvent = {
//     type: PixelstreamingEventType.Pause
// }

export type ResetPixelstreaming = {
    type: PixelstreamingCommandType.Reset
}

export type PixelstreamingCommand =
    | InitializePixelstreaming
    | PlayPixelstreaming
    | ResetPixelstreaming

export type PixelstreamingEvent =
    | PixelstreamingCommand
    | SignalingEvents
    | ICEEvents
    | DataChannelEvent
    | InputEvent
    | VideoEvent
    | PixelstreamingError
