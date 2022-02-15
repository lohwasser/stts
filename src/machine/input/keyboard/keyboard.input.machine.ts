import {
    assign,
    createMachine,
    send,
    sendParent,
    spawn,
    type ActorRef,
    type MachineConfig,
} from 'xstate'
import {
    KeyboardInputEventType,
    type KeyboardInputEvents,
    type KeyDown,
    type KeyPress,
    type KeyUp,
} from './keyboard.input.event'

import KeyboardListener from './keyboard.listener'
import { DataChannelRequestType } from 'src/domain/DatachannelRequestType'

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
        {
            actions: {
                sendToParent: sendParent(
                    (_c: KeyboardInputContext, event: KeyboardInputEvents) =>
                        event
                ),

                spawnKeyboardListener: assign({
                    keyboardListener: (context) => {
                        const observable = KeyboardListener(
                            context.suppressBrowserKeys
                        )
                        return spawn(observable)
                    },
                }),

                sendKeyDown: send(
                    (
                        _context: KeyboardInputContext,
                        event: KeyboardInputEvents
                    ) => {
                        const keyCode: number = (event as KeyDown).keyCode
                        const repeat: number = (event as KeyDown).repeat ? 1 : 0
                        const data = new Uint8Array([
                            DataChannelRequestType.KeyDown,
                            keyCode,
                            repeat,
                        ])
                        return {
                            type: KeyboardInputEventType.Data,
                            data: data.buffer,
                        }
                    }
                ),

                sendKeyUp: send(
                    (
                        _context: KeyboardInputContext,
                        event: KeyboardInputEvents
                    ) => {
                        const keyCode: number = (event as KeyUp).keyCode
                        const data = new Uint8Array([
                            DataChannelRequestType.KeyUp,
                            keyCode,
                        ])
                        return {
                            type: KeyboardInputEventType.Data,
                            data: data.buffer,
                        }
                    }
                ),

                sendKeyPress: send(
                    (
                        _context: KeyboardInputContext,
                        event: KeyboardInputEvents
                    ) => {
                        const charCode: number = (event as KeyPress).charCode
                        const data = new DataView(new ArrayBuffer(3))
                        data.setUint8(0, DataChannelRequestType.KeyPress)
                        data.setUint16(1, charCode, true)
                        return {
                            type: KeyboardInputEventType.Data,
                            data: data.buffer,
                        }
                    }
                ),
            },
        }
    )
}
