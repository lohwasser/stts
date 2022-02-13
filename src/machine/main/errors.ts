export enum PixelstreamingErrorType {
    NoInstance = 'pixelstreaming_no_instance_error',
}

// export type ErrorMessage = {
//     message: unknown
// }

export type NoInstanceError = {
    type: PixelstreamingErrorType.NoInstance
}

export type PixelstreamingError = NoInstanceError
