export type KeyboardInputEvents = KeyData | KeyDown | KeyUp | KeyPress

export enum KeyboardInputEventType {
    Data = 'key_data',
    Down = 'key_down',
    Up = 'key_up',
    Press = 'key_press',
}

export type HasKeyCode = {
    keyCode: number
}

// 'Public' event sent tot the parent
export type KeyData = {
    type: KeyboardInputEventType.Data
    data: ArrayBufferLike
}

export type KeyDown = {
    type: KeyboardInputEventType.Down
    repeat: boolean
} & HasKeyCode

export type KeyUp = {
    type: KeyboardInputEventType.Up
} & HasKeyCode

export type KeyPress = {
    type: KeyboardInputEventType.Press
    charCode: number
}
