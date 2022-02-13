export enum VideoEventType {
    LoadStart = 'video_loaded_metadata',
    LoadedMetadata = 'video_loaded_metadata',
    Progress = 'video_progress',
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

export type VideoEvent =
    | VideoLoadStartEvent
    | VideoLoadedMetadataEvent
    | VideoProgressEvent
