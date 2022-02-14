import { DataChannelRequestType } from 'src/domain/DatachannelRequestType'
import { assign, send, sendParent, spawn } from 'xstate'
import {
    KeyboardInputEventType,
    type KeyboardInputEvents,
    type KeyDown,
    type KeyPress,
    type KeyUp,
} from './keyboard.input.event'
import type { KeyboardInputContext } from './keyboard.input.machine'
import KeyboardListener from './keyboard.listener'

const keyboardInputActions = {
    sendToParent: sendParent(
        (_c: KeyboardInputContext, event: KeyboardInputEvents) => event
    ),

    spawnKeyboardListener: assign({
        keyboardListener: (context: KeyboardInputContext) => {
            const observable = KeyboardListener(context.suppressBrowserKeys)
            return spawn(observable)
        },
    }),

    sendKeyDown: send(
        (_context: KeyboardInputContext, event: KeyboardInputEvents) => {
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
        (_context: KeyboardInputContext, event: KeyboardInputEvents) => {
            const keyCode: number = (event as KeyUp).keyCode
            const data = new Uint8Array([DataChannelRequestType.KeyUp, keyCode])
            return {
                type: KeyboardInputEventType.Data,
                data: data.buffer,
            }
        }
    ),

    sendKeyPress: send(
        (_context: KeyboardInputContext, event: KeyboardInputEvents) => {
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
}

export default keyboardInputActions
