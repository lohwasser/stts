import type { Vector2 } from 'fsm/src/lib/vector'

export type MouseInputEvents =
    | MouseData
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

export enum MouseInputEventType {
    Data = 'mouse_data',
    Enter = 'mouse_enter',
    Leave = 'mouse_leave',
    Move = 'mouse_move',
    Down = 'mouse_down',
    Up = 'mouse_up',
    Wheel = 'mouse_wheel',
    ContextMenu = 'context_menu',
    RequestPointerLock = 'request_pointer_lock',
    LockStateChange = 'lock_state_change',
}

export type HasMouseButtons = {
    buttons: number
}

export type HasMouseButton = {
    button: number
}

export type HasCoordinates = {
    coordinates: Vector2
}

// 'Public' event sent tot the parent
export type MouseData = {
    type: MouseInputEventType.Data

    // we need the possibility to send multiple mouse events at once
    // (e.g. in pressMouseButtons)
    data: Array<ArrayBufferLike>
}

export type MouseEnter = {
    type: MouseInputEventType.Enter
} & HasMouseButtons &
    HasCoordinates

export type MouseLeave = {
    type: MouseInputEventType.Leave
} & HasMouseButtons &
    HasCoordinates

export type MouseMove = {
    type: MouseInputEventType.Move
    delta: Vector2
} & HasCoordinates

export type MouseDown = {
    type: MouseInputEventType.Down
} & HasMouseButton &
    HasCoordinates

export type MouseUp = {
    type: MouseInputEventType.Up
} & HasMouseButton &
    HasCoordinates

export type MouseWheel = {
    type: MouseInputEventType.Wheel
    delta: number
} & HasCoordinates

export type ContextMenu = {
    type: MouseInputEventType.ContextMenu
} & HasMouseButton &
    HasCoordinates

// export type PressMouseButtonEvent = {
//     type: MouseInputEventType
//     button: number,
//     position: Vector2,
// }

// export type ReleaseMouseButtonEvent = {
//     type: MouseInputEventType
//     button: number,
//     position: Vector2,
// }

export type RequestPointerLock = {
    type: MouseInputEventType.RequestPointerLock
} & HasCoordinates

export type LockStateChange = {
    type: MouseInputEventType.LockStateChange
    element: Element | null
}
