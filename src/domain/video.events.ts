import type { Vector2 } from 'fsm/src/lib/vector'

export type VideoEvent =
    | VideoLoadStartEvent
    | VideoLoadedMetadataEvent
    | VideoProgressEvent

export enum VideoEventType {
    LoadStart = 'video_loaded_metadata',
    LoadedMetadata = 'video_loaded_metadata',
    Progress = 'video_progress',
    Stats = 'video_stats',
}

export type VideoLoadStartEvent = {
    type: VideoEventType.LoadStart
}

export type VideoLoadedMetadataEvent = {
    type: VideoEventType.LoadedMetadata
}

export type VideoProgressEvent = {
    type: VideoEventType.Progress
}

export type VideoStatsEvent = {
    type: VideoEventType.Stats
    stats: Partial<VideoStats>
}

export type VideoStats = {
    byteRate: number
    frameRate: number
    videoResolution: Vector2
}
