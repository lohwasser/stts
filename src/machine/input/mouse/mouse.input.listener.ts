import { fromEvent, merge, Observable } from 'rxjs'
import { map, tap } from 'rxjs/operators'
import { Vector2 } from 'three'

import {
    ContextMenu,
    LockStateChange,
    MouseDown,
    MouseEnter,
    MouseEventType,
    MouseInputEvent,
    MouseLeave,
    MouseMove,
    MouseUp,
    MouseWheel,
    RequestPointerLock,
} from './mouse.input.event'

const enterAndLeaveEvents = (
    playerElement: HTMLVideoElement
): Observable<MouseInputEvent> => {
    const mouseEnter = fromEvent(playerElement, 'mouseenter').pipe(
        map((event) => event as MouseEvent),
        map(
            (event: MouseEvent): MouseEnter => ({
                type: MouseEventType.Enter,
                buttons: event.buttons,
                coordinates: new Vector2(event.x, event.y),
            })
        )
    )

    const mouseLeave = fromEvent(playerElement, 'mouseleave').pipe(
        map((event) => event as MouseEvent),
        map(
            (event: MouseEvent): MouseLeave => ({
                type: MouseEventType.Leave,
                buttons: event.buttons,
                coordinates: new Vector2(event.x, event.y),
            })
        )
    )

    return merge(mouseEnter, mouseLeave)
}

// A locked mouse works by the user clicking in the browser player and the
// cursor disappears and is locked. The user moves the cursor and the camera
// moves, for example. The user presses escape to free the mouse.
const lockedMouseEvents = (
    playerElement: HTMLVideoElement
): Observable<MouseInputEvent> => {
    // playerElement.requestPointerLock = playerElement.requestPointerLock || playerElement.mozRequestPointerLock;
    // document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

    const requestPointerLock$ = fromEvent(playerElement, 'click').pipe(
        map(
            (event: MouseEvent): RequestPointerLock => ({
                type: MouseEventType.RequestPointerLock,
                coordinates: new Vector2(event.x, event.y),
            })
        )
    )

    // document.addEventListener('mozpointerlockchange', lockStateChange, false);
    const lockStateChange$ = fromEvent(document, 'pointerlockchange').pipe(
        map(
            (event): LockStateChange => ({
                type: MouseEventType.LockStateChange,
                element: document.pointerLockElement,
            })
        )
    )

    const mouseMove$ = fromEvent(document, 'mousemove').pipe(
        map((event: Event): MouseEvent => event as MouseEvent),

        // tap((event: MouseEvent) => {
        //     console.debug("Mouse position", event.x, event.y)
        //     console.debug("Mouse movement", event.movementX, event.movementY)
        //     console.debug("Mouse offset", event.offsetX, event.offsetY, "\n")
        // }),

        map(
            (event: MouseEvent): MouseMove => ({
                type: MouseEventType.Move,
                coordinates: new Vector2(event.offsetX, event.offsetY),
                delta: new Vector2(event.movementX, event.movementY),
            })
        )
    )

    const mouseDown$ = fromEvent(document, 'mousedown').pipe(
        map((event: Event): MouseEvent => event as MouseEvent),
        map(
            (event: MouseEvent): MouseDown => ({
                type: MouseEventType.Down,
                button: event.button,
                coordinates: new Vector2(event.x, event.y),
            })
        )
    )

    const mouseUp$ = fromEvent(document, 'mouseup').pipe(
        map((event: Event): MouseEvent => event as MouseEvent),
        map(
            (event: MouseEvent): MouseUp => ({
                type: MouseEventType.Up,
                button: event.button,
                coordinates: new Vector2(event.x, event.y),
            })
        )
    )

    const wheel$ = fromEvent(document, 'wheel').pipe(
        map((event: Event): WheelEvent => event as WheelEvent),

        // tap((event: WheelEvent) => {
        //    const { deltaMode,
        //     deltaX,
        //     deltaY,
        //     deltaZ,
        //     DOM_DELTA_LINE,
        //     DOM_DELTA_PAGE,
        //     DOM_DELTA_PIXEL} = event
        //     console.debug(`WheelEvent`, deltaMode, deltaX, deltaY, deltaZ, DOM_DELTA_LINE, DOM_DELTA_PAGE, DOM_DELTA_PIXEL)
        // }),

        map(
            (event: WheelEvent): MouseWheel => ({
                type: MouseEventType.Wheel,
                delta: event.deltaY,
                coordinates: new Vector2(event.offsetX, event.offsetY),
            })
        )
    )

    return merge(
        requestPointerLock$,
        lockStateChange$,
        mouseMove$,
        mouseDown$,
        mouseUp$,
        wheel$
    )
}

// A hovering mouse works by the user clicking the mouse button when they want
// the cursor to have an effect over the video. Otherwise the cursor just
// passes over the browser.

const hoveringMouseEvents = (
    playerElement: HTMLVideoElement
): Observable<MouseInputEvent> => {
    const mouseMove$ = fromEvent(document, 'mousemove').pipe(
        tap((event: Event) => event.preventDefault()),
        map((event: Event): MouseEvent => event as MouseEvent),
        map(
            (event: MouseEvent): MouseMove => ({
                type: MouseEventType.Move,
                coordinates: new Vector2(event.offsetX, event.offsetY),
                delta: new Vector2(event.movementX, event.movementY),
            })
        )
    )

    const mouseDown$ = fromEvent(document, 'mousedown').pipe(
        tap((event: Event) => event.preventDefault()),
        map((event: Event): MouseEvent => event as MouseEvent),
        map(
            (event: MouseEvent): MouseDown => ({
                type: MouseEventType.Down,
                button: event.button,
                coordinates: new Vector2(event.offsetX, event.offsetY),
            })
        )
    )

    const mouseUp$ = fromEvent(document, 'mouseup').pipe(
        tap((event: Event) => event.preventDefault()),
        map((event: Event): MouseEvent => event as MouseEvent),
        map(
            (event: MouseEvent): MouseUp => ({
                type: MouseEventType.Up,
                button: event.button,
                coordinates: new Vector2(event.offsetX, event.offsetY),
            })
        )
    )

    const wheel$ = fromEvent(document, 'wheel').pipe(
        tap((event: Event) => event.preventDefault()),
        map((event: Event): WheelEvent => event as WheelEvent),
        map(
            (event: WheelEvent): MouseWheel => ({
                type: MouseEventType.Wheel,
                delta: event.deltaY,
                coordinates: new Vector2(event.offsetX, event.offsetY),
            })
        )
    )

    const contextMenu$ = fromEvent(document, 'contextmenu').pipe(
        tap((event: Event) => event.preventDefault()),
        map((event: Event): MouseEvent => event as MouseEvent),
        map(
            (event: MouseEvent): ContextMenu => ({
                type: MouseEventType.ContextMenu,
                button: event.button,
                coordinates: new Vector2(event.offsetX, event.offsetY),
            })
        )
    )

    return merge(mouseMove$, mouseDown$, mouseUp$, wheel$, contextMenu$)
}

const mouseListener = (
    playerElement: HTMLVideoElement
): Observable<MouseInputEvent> => {
    const enterAndLeave$ = enterAndLeaveEvents(playerElement)
    const mouseEvents$ = lockedMouseEvents(playerElement)
    return merge(enterAndLeave$, mouseEvents$)
}

export default mouseListener