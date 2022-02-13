export type BitrateDescriptor = {
    LowBitrate: number
    HighBitrate: number
    MinFPS: number
}

export type PrioritiseQualityDescriptor = {
    PrioritiseQuality: number
}

export type ConsoleDescriptor = {
    Console: string
}

export type Descriptor = PrioritiseQualityDescriptor | ConsoleDescriptor
