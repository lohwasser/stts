import type { KeyboardInputEvents } from './keyboard/keyboard.input.event'
import type { MouseInputEvents } from './mouse/mouse.input.event'
import type { VideoInputEvent } from './video/video.input.event'

export type InputEvents =
    | KeyboardInputEvents
    | MouseInputEvents
    | VideoInputEvent
