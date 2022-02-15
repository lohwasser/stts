import { Vector2 } from 'fsm/src/lib/vector'
import type { VideoEvent, VideoStatsEvent } from 'src/domain/video.events'
import type { InputContext } from './input.machine'
import { ControlSchemeType } from './input.types'

export const inputGuards = {
    lockedMouseControlScheme: (context: InputContext): boolean => {
        switch (context.controlScheme) {
            case ControlSchemeType.HoveringMouse:
                return false
            case ControlSchemeType.LockedMouse:
                return true
            default:
                console.log(
                    `ERROR: Unknown control scheme ${context.controlScheme}`
                )
                return true
        }
    },

    // checks whether the player element has received a pointer lock
    isPointerLocked: (context: InputContext): boolean => context.isLocked,

    updateVideoSize: (context: InputContext, event: VideoEvent): boolean => {
        const { stats } = event as VideoStatsEvent
        const videoResolution = stats.videoResolution
        if (videoResolution === undefined) return false
        if (videoResolution.equals(new Vector2(0, 0))) return false

        const ratio: number = videoResolution.x / videoResolution.y
        const mainElement = document.getElementById('svelte')
        const maxWidth = mainElement.clientWidth * 0.8

        let { width, height } = videoResolution
        if (width > maxWidth) {
            width = Math.round(maxWidth)
            height = Math.round(maxWidth / ratio)
        }
        let videoSize = new Vector2(width, height)

        const playerDimensions = new Vector2(
            context.playerElement.clientWidth,
            context.playerElement.clientHeight
        )

        // due to the scaling and multiplication, we're not quite exact
        // so, to check for equality, we need an epsilon
        const ϵ = 2
        const aboutTheSame = videoSize.aboutEqual(playerDimensions, ϵ)
        return !aboutTheSame
    },
}
