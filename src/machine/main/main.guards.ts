import type { PixelstreamingContext } from './main.machine'
import type { PixelstreamingConditionPredicate } from './main.types'

export default {
    // checks whether the player element has received a pointer lock
    startInput: (context: PixelstreamingContext): boolean => {
        // console.log("inputRunning", context.inputActor === undefined)
        return context.inputActor === undefined
    },
}
