export enum VideoEventType {
    LoadStart = 'VIDEO_LOAD_START',
    LoadedMetadata = 'VIDEO_LOADED_METADATA',
    Progress = 'VIDEO_PROGRESS',
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
