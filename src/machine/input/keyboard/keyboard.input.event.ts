export type HasKeyCode = {
    keyCode: number
}

export type KeyDown = {
    type: 'key_down'
    repeat: boolean
} & HasKeyCode

export type KeyUp = {
    type: 'key_up'
} & HasKeyCode

export type KeyPress = {
    type: 'key_press'
    charCode: number
}

export type KeyboardInputEvents = KeyDown | KeyUp | KeyPress
