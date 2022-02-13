import { assign, sendParent, spawn } from 'xstate'
import KeyboardListener from './keyboard.listener'
import type { InputEvent } from '../input.events'
import type { InputContext } from '../input.machine'
import type { InputFunctionMap } from '../input.types'
import type { KeyDown, KeyPress, KeyUp } from './keyboard.input.event'
import { DataChannelRequestType } from '$lib/domain/DatachannelRequestType'

const keyboardInputActions: InputFunctionMap = {
    spawnKeyboardListener: assign({
        keyboardListener: (context: InputContext) =>
            spawn(KeyboardListener(context.suppressBrowserKeys)),
    }),

    sendKeyDown: (context: InputContext, event: InputEvent) => {
        const keyCode: number = (event as KeyDown).keyCode
        const repeat: number = (event as KeyDown).repeat ? 1 : 0
        const data = new Uint8Array([
            DataChannelRequestType.KeyDown,
            keyCode,
            repeat,
        ])
        context.dataChannel.send(data.buffer)
    },

    sendKeyUp: (context: InputContext, event: InputEvent) => {
        const keyCode: number = (event as KeyUp).keyCode
        const data = new Uint8Array([DataChannelRequestType.KeyUp, keyCode])
        context.dataChannel.send(data.buffer)
    },

    sendKeyPress: (context: InputContext, event: InputEvent) => {
        const charCode: number = (event as KeyPress).charCode
        const data = new DataView(new ArrayBuffer(3))
        data.setUint8(0, DataChannelRequestType.KeyPress)
        data.setUint16(1, charCode, true)
        context.dataChannel.send(data.buffer)
    },
}

export default keyboardInputActions
