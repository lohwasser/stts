// Must be kept in sync with PixelStreamingProtocol::EToClientMsg C++ enum.
export enum DatachannelEventType {
    QualityControlOwnership = 'QUALITY_CONTROL_OWNERSHIP',
    Response = 'RESPONSE',
    Command = 'COMMAND',
    FreezeFrame = 'FREEZE_FRAME',
    UnfreezeFrame = 'UNFREEZE_FRAME',
    VideoEncoderAvgQP = 'VIDEO_ENCODER_AVG_QP',
    NoOp = 'NO_OP',
}

// export const datachannelEventMap: Record<DatachannelEventType, number> = {
//     [DatachannelEventType.QualityControlOwnership]: 0,
//     [DatachannelEventType.Response]: 1,
//     [DatachannelEventType.Command]: 2,
//     [DatachannelEventType.FreezeFrame]: 3,
//     [DatachannelEventType.UnfreezeFrame]: 4,
//     [DatachannelEventType.VideoEncoderAvgQP]: 5,
//     [DatachannelEventType.NoOp]: -1,
// }

export const datachannelEventMap: Record<number, DatachannelEventType> = {
    0: DatachannelEventType.QualityControlOwnership,
    1: DatachannelEventType.Response,
    2: DatachannelEventType.Command,
    3: DatachannelEventType.FreezeFrame,
    4: DatachannelEventType.UnfreezeFrame,
    5: DatachannelEventType.VideoEncoderAvgQP,
}

export type QualityControlOwnership = {
    type: DatachannelEventType.QualityControlOwnership
    ownershipGranted: boolean
}

export type Response = {
    type: DatachannelEventType.Response
}

export type Command = {
    type: DatachannelEventType.Command
}

export type VideoEncoderAvgQP = {
    type: DatachannelEventType.VideoEncoderAvgQP
    videoEncoderQP: string
}

export type NoOp = {
    type: DatachannelEventType.NoOp
}

export type DataChannelEvent =
    | QualityControlOwnership
    | Response
    | Command
    | VideoEncoderAvgQP
    | NoOp
