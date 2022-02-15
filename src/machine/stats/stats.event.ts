import type { VideoStats } from './stats.types'

export type StatsEvent = VideoStatsEvent

export enum StatsEventType {
    Video = 'video_stats',
}

export type VideoStatsEvent = {
    type: StatsEventType.Video
    stats: Partial<VideoStats>
}
