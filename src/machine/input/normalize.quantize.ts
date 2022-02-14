import { Vector2 } from 'fsm/src/lib/vector'
import type { Ranged, NormalizationFunctions } from './input.types'

export enum AspectRatio {
    Landscape,
    Square,
    Portrait,
}

export const normalizeAndQuantize = (
    videoElement: HTMLVideoElement
): NormalizationFunctions => {
    const windowAspectRatio = window.innerHeight / window.innerWidth
    const videoAspectRatio = videoElement.videoHeight / videoElement.videoWidth

    console.log('normalizeAndQuantize')
    // console.debug('windowAspectRatio', windowAspectRatio)
    // console.debug('videoAspectRatio', videoAspectRatio)

    // Unsigned XY positions are the ratio (0.0..1.0) along a viewport axis,
    // quantized into an uint16 (0..65536).
    // Signed XY deltas are the ratio (-1.0..1.0) along a viewport axis,
    // quantized into an int16 (-32767..32767).
    // This allows the browser viewport and client viewport to have a different
    // size.
    // Hack: Currently we set an out-of-range position to an extreme (65535)
    // as we can't yet accurately detect mouse enter and leave events
    // precisely inside a video with an aspect ratio which causes mattes.

    const frame = new Vector2(window.innerWidth, window.innerHeight)
    const ratio = videoAspectRatio / windowAspectRatio

    if (windowAspectRatio > videoAspectRatio) return larger(frame, ratio)
    else return smaller(frame, ratio)
}

const larger = (frame: Vector2, ratio: number): NormalizationFunctions => {
    // console.log('Setup Normalize and Quantize for playerAspectRatio > videoAspectRatio')

    // Unsigned.
    const normalizeAndQuantizeUnsigned = ({
        x,
        y,
    }: Vector2): [Vector2, Ranged] => {
        const normalizedX = x / frame.x
        const normalizedY = ratio * (y / frame.y - 0.5) + 0.5
        if (
            normalizedX < 0.0 ||
            normalizedX > 1.0 ||
            normalizedY < 0.0 ||
            normalizedY > 1.0
        ) {
            return [new Vector2(65535, 65535), { inRange: false }]
        } else {
            return [
                new Vector2(normalizedX * 65536, normalizedY * 65536),
                { inRange: true },
            ]
        }
    }

    const unquantizeAndDenormalizeUnsigned = ({ x, y }: Vector2): Vector2 => {
        const normalizedX = x / 65536
        const normalizedY = (y / 65536 - 0.5) / ratio + 0.5
        return new Vector2(normalizedX * frame.x, normalizedY * frame.y)
    }
    // Signed.
    const normalizeAndQuantizeSigned = ({ x, y }: Vector2): Vector2 => {
        const normalizedX = x / (0.5 * frame.x)
        const normalizedY = (ratio * y) / (0.5 * frame.y)
        return new Vector2(normalizedX * 32767, normalizedY * 32767)
    }

    return {
        normalizeAndQuantizeUnsigned,
        unquantizeAndDenormalizeUnsigned,
        normalizeAndQuantizeSigned,
    }
}

const smaller = (frame: Vector2, ratio: number): NormalizationFunctions => {
    console.log(
        'Setup Normalize and Quantize for playerAspectRatio <= videoAspectRatio'
    )

    // Unsigned.
    const normalizeAndQuantizeUnsigned = ({
        x,
        y,
    }: Vector2): [Vector2, Ranged] => {
        const normalizedX = ratio * (x / frame.x - 0.5) + 0.5
        const normalizedY = y / frame.y
        if (
            normalizedX < 0.0 ||
            normalizedX > 1.0 ||
            normalizedY < 0.0 ||
            normalizedY > 1.0
        ) {
            return [new Vector2(65535, 65535), { inRange: false }]
        } else {
            return [
                new Vector2(normalizedX * 65535, normalizedX * 65535),
                { inRange: true },
            ]
        }
    }

    const unquantizeAndDenormalizeUnsigned = ({ x, y }: Vector2): Vector2 => {
        const normalizedX = (x / 65536 - 0.5) / ratio + 0.5
        const normalizedY = y / 65536
        return new Vector2(normalizedX * frame.x, normalizedY * frame.y)
    }

    // Signed.
    const normalizeAndQuantizeSigned = ({ x, y }: Vector2): Vector2 => {
        const normalizedX = (ratio * x) / (0.5 * frame.x)
        const normalizedY = y / (0.5 * frame.y)
        return new Vector2(normalizedX * 32767, normalizedY * 32767)
    }

    return {
        normalizeAndQuantizeUnsigned,
        unquantizeAndDenormalizeUnsigned,
        normalizeAndQuantizeSigned,
    }
}
