import { assign, sendParent } from 'xstate'
import type { InputContext } from '../input.machine'
import { normalizeAndQuantize } from '../normalize.quantize'

export const baseInputActions = {
    sendToParent: sendParent((_context, event: InputEvent) => event),

    setupNormalizeAndQuantize: assign({
        normalizationFn: (context: InputContext) => {
            const normalizationFn = normalizeAndQuantize(context.playerElement)
            // console.debug('normalizationFn', normalizationFn)
            return normalizationFn
        },
    }),
}
