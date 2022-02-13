import { assign, sendParent, spawn } from 'xstate'
import type { InputEvent } from '../input.events'
import type { InputFunctionMap } from '../input.types'
import { normalizeAndQuantize } from '../normalize.quantize'
import type { InputContext } from '../input.machine'

export const baseInputActions: InputFunctionMap = {
    relayToParent: sendParent((_context, event: InputEvent) => event),

    setupNormalizeAndQuantize: assign({
        normalizationFn: (context: InputContext) => {
            const normalizationFn = normalizeAndQuantize(context.playerElement)
            // console.debug('normalizationFn', normalizationFn)
            return normalizationFn
        },
    }),
}
