import type { WebRTCStats } from '$lib/domain/webrtc'

export enum VideoInputEventType {
    NormalizeAndQuantize = 'NORMALIZE_AND_QUANTIZE',
}

export type NormalizeAndQuantize = {
    type: VideoInputEventType.NormalizeAndQuantize
}

export type VideoInputEvent = WebRTCStats | NormalizeAndQuantize
