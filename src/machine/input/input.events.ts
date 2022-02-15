import type { KeyboardInputEvents } from './keyboard/keyboard.input.event'
import type { MouseInputEvents } from './mouse/mouse.input.event'
import type { VideoInputEvent } from '../data-channel/data-channel.event'

export type InputEvents =
    | KeyboardInputEvents
    | MouseInputEvents
    | VideoInputEvent
