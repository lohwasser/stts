// Must be kept in sync with PixelStreamingProtocol::EToClientMsg C++ enum.
export enum DatachannelMessageType {
    QualityControlOwnership = 'QUALITY_CONTROL_OWNERSHIP',
    Response = 'RESPONSE',
    Command = 'COMMAND',
    FreezeFrame = 'FREEZE_FRAME',
    UnfreezeFrame = 'UNFREEZE_FRAME',
    VideoEncoderAvgQP = 'VIDEO_ENCODER_AVG_QP',
    NoOp = 'NO_OP',
}

// export const datachannelMessageMap: Record<DatachannelMessageType, number> = {
//     [DatachannelMessageType.QualityControlOwnership]: 0,
//     [DatachannelMessageType.Response]: 1,
//     [DatachannelMessageType.Command]: 2,
//     [DatachannelMessageType.FreezeFrame]: 3,
//     [DatachannelMessageType.UnfreezeFrame]: 4,
//     [DatachannelMessageType.VideoEncoderAvgQP]: 5,
//     [DatachannelMessageType.NoOp]: -1,
// }

export const datachannelMessageMap: Record<number, DatachannelMessageType> = {
    0: DatachannelMessageType.QualityControlOwnership,
    1: DatachannelMessageType.Response,
    2: DatachannelMessageType.Command,
    3: DatachannelMessageType.FreezeFrame,
    4: DatachannelMessageType.UnfreezeFrame,
    5: DatachannelMessageType.VideoEncoderAvgQP,
}

export type QualityControlOwnership = {
    type: DatachannelMessageType.QualityControlOwnership
    ownershipGranted: boolean
}

export type Response = {
    type: DatachannelMessageType.Response
}

export type Command = {
    type: DatachannelMessageType.Command
}

export type VideoEncoderAvgQP = {
    type: DatachannelMessageType.VideoEncoderAvgQP
    videoEncoderQP: string
}

export type NoOp = {
    type: DatachannelMessageType.NoOp
}

export type DataChannelMessage =
    | QualityControlOwnership
    | Response
    | Command
    | VideoEncoderAvgQP
    | NoOp
