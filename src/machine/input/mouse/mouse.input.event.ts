import type { Vector2 } from 'src/domain/Vector2'

export type HasMouseButtons = {
    buttons: number
}

export type HasMouseButton = {
    button: number
}

export type HasCoordinates = {
    coordinates: Vector2
}

export type MouseEnter = {
    type: 'mouse_enter'
} & HasMouseButtons &
    HasCoordinates

export type MouseLeave = {
    type: 'mouse_leave'
} & HasMouseButtons &
    HasCoordinates

export type MouseMove = {
    type: 'mouse_move'
    delta: Vector2
} & HasCoordinates

export type MouseDown = {
    type: 'mouse_down'
} & HasMouseButton &
    HasCoordinates

export type MouseUp = {
    type: 'mouse_up'
} & HasMouseButton &
    HasCoordinates

export type MouseWheel = {
    type: 'mouse_wheel'
    delta: number
} & HasCoordinates

export type ContextMenu = {
    type: 'context_menu'
} & HasMouseButton &
    HasCoordinates

// export type PressMouseButtonEvent = {
//     type:'release_mouse_button'
//     button: number,
//     position: Vector2,
// }

// export type ReleaseMouseButtonEvent = {
//     type:'press_mouse_button',
//     button: number,
//     position: Vector2,
// }

export type RequestPointerLock = {
    type: 'request_pointer_lock'
} & HasCoordinates

export type LockStateChange = {
    type: 'lock_state_change'
    element: Element
}

export type MouseInputEvents =
    | MouseEnter
    | MouseLeave
    | MouseMove
    | MouseDown
    | MouseUp
    | MouseWheel
    | ContextMenu
    // | PressMouseButtonEvent
    // | ReleaseMouseButtonEvent
    | RequestPointerLock
    | LockStateChange
