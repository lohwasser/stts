import type { InputContext } from './input.machine'
import { ControlSchemeType } from './input.types'
import type { WebRTCStats } from 'src/domain/webrtc'
import { Vector2 } from 'src/domain/Vector2'

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

    updateVideoSize: (context: InputContext, event: InputEvent): boolean => {
        const { stats } = event as WebRTCStats
        const videoResolution = stats.videoResolution
        if (videoResolution === undefined) return false
        if (videoResolution.equals(Vector2(0, 0))) return false

        const ratio: number = videoResolution.width / videoResolution.height
        const mainElement = document.getElementById('svelte')
        const maxWidth = mainElement.clientWidth * 0.8

        let { width, height } = videoResolution
        if (width > maxWidth) {
            width = Math.round(maxWidth)
            height = Math.round(maxWidth / ratio)
        }
        let videoSize = Vector2(width, height)

        const playerDimensions = Vector2(
            context.playerElement.clientWidth,
            context.playerElement.clientHeight
        )

        // due to the scaling and multiplication, we're not quite exact
        // so, to check for equality, we need an epsilon
        const aboutTheSame = videoSize.aboutEqual(playerDimensions, 2)
        return !aboutTheSame
    },
}
