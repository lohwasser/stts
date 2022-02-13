import type { PixelstreamingContext } from './pixelstreaming.machine'
import type { PixelstreamingConditionPredicate } from './pixelstreaming.types'

const pixelstreamingGuards: Record<string, PixelstreamingConditionPredicate> = {
    // checks whether the player element has received a pointer lock
    startInput: (context: PixelstreamingContext): boolean => {
        // console.log("inputRunning", context.inputActor === undefined)
        return context.inputActor === undefined
    },
}

export default pixelstreamingGuards
