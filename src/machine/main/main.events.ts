export type InitializePixelstreaming = {
    type: 'pixelstreaming_initialize'
    videoElement: HTMLVideoElement
}

export type PlayPixelstreaming = {
    type: 'pixelstreaming_play'
}

// export type PausePixelstreaming = {
//     type: "pixelstreaming_pause"
// }

export type ResetPixelstreaming = {
    type: 'pixelstreaming_reset'
}

export type PixelstreamingCommand =
    | InitializePixelstreaming
    | PlayPixelstreaming
    | ResetPixelstreaming

export type MainEvents = PixelstreamingCommand
