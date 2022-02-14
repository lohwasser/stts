import { fromEvent, merge, Observable } from 'rxjs'
import { map, tap } from 'rxjs/operators'
import { SpecialKeyCodes } from '../input.types'
import {
    KeyboardInputEventType,
    type KeyboardInputEvents,
    type KeyDown,
    type KeyPress,
    type KeyUp,
} from './keyboard.input.event'

export default (
    suppressBrowserKeys: boolean
): Observable<KeyboardInputEvents> => {
    const keyDown = fromEvent(document, 'keydown').pipe(
        map((event) => event as KeyboardEvent),
        tap((event) => {
            if (suppressBrowserKeys && isKeyCodeBrowserKey(event.keyCode))
                event.preventDefault()
        }),
        map(
            (event: KeyboardEvent): KeyDown => ({
                type: KeyboardInputEventType.Down,
                keyCode: getKeyCode(event),
                repeat: event.repeat,
            })
        )
    )

    const keyUp = fromEvent(document, 'keyup').pipe(
        map((event) => event as KeyboardEvent),
        tap((event) => {
            if (suppressBrowserKeys && isKeyCodeBrowserKey(event.keyCode))
                event.preventDefault()
        }),
        map(
            (event: KeyboardEvent): KeyUp => ({
                type: KeyboardInputEventType.Up,
                keyCode: getKeyCode(event),
            })
        )
    )

    const keyPress = fromEvent(document, 'keypress').pipe(
        map((event) => event as KeyboardEvent),
        tap((event) => {
            if (suppressBrowserKeys && isKeyCodeBrowserKey(event.keyCode))
                event.preventDefault()
        }),
        map(
            (event: KeyboardEvent): KeyPress => ({
                type: KeyboardInputEventType.Press,
                charCode: event.charCode,
            })
        )
    )

    return merge(keyDown, keyUp, keyPress)
    // .pipe(tap((e) => console.debug('KeyboardEvent: ', e)))
}

// Browser keys do not have a charCode so we only need to test keyCode.
const isKeyCodeBrowserKey = (keyCode: number): boolean =>
    // Function keys or tab key.
    (keyCode >= 112 && keyCode <= 123) || keyCode === 9

// We want to be able to differentiate between left and right versions of some
// keys.
const getKeyCode = (event: KeyboardEvent): number => {
    if (event.keyCode === SpecialKeyCodes.Shift && event.code === 'ShiftRight')
        return SpecialKeyCodes.RightShift
    else if (
        event.keyCode === SpecialKeyCodes.Control &&
        event.code === 'ControlRight'
    )
        return SpecialKeyCodes.RightControl
    else if (event.keyCode === SpecialKeyCodes.Alt && event.code === 'AltRight')
        return SpecialKeyCodes.RightAlt
    else return event.keyCode
}
