import { createMachine, type ActorRef, type MachineConfig } from 'xstate'
import {
    KeyboardInputEventType,
    type KeyboardInputEvents,
} from './keyboard.input.event'
import actions from './keyboard.input.actions'

export type KeyboardInputContext = {
    // Browser keys are those which are typically used by the browser UI. We
    // usually want to suppress these to allow, for example, UE4 to show shader
    // complexity with the F5 key without the web page refreshing.
    suppressBrowserKeys: boolean

    keyboardListener?: ActorRef<KeyboardInputEvents>
}

export interface KeyboardInputStateSchema {
    states: {
        ok: {}
        error: {}
    }
}

const keyboardInputMachineConfig = (): MachineConfig<
    KeyboardInputContext,
    KeyboardInputStateSchema,
    KeyboardInputEvents
> => ({
    id: 'keyboard-input',
    schema: {
        context: {} as KeyboardInputContext,
        events: {} as KeyboardInputEvents,
    },
    context: {
        suppressBrowserKeys: true,
        keyboardListener: undefined,
    },
    initial: 'ok',
    states: {
        ok: {
            entry: 'spawnKeyboardListener',
            on: {
                [KeyboardInputEventType.Down]: {
                    actions: 'sendKeyDown',
                },
                [KeyboardInputEventType.Up]: {
                    actions: 'sendKeyUp',
                },
                [KeyboardInputEventType.Press]: {
                    actions: 'sendKeyPress',
                },
                [KeyboardInputEventType.Data]: {
                    actions: 'sendToParent',
                },
            },
        },
        error: {
            id: 'error',
            type: 'final',
        },
    },
})

// export const makeMainMachine = (): StateMachine<MainContext, MainStateSchema, MainEvents> =>
export const makeInputMachine = () => {
    const configuration = keyboardInputMachineConfig()

    return createMachine<KeyboardInputContext, KeyboardInputEvents>(
        configuration,
        { actions }
    )
}
