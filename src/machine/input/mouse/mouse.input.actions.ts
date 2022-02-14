import { assign, send, sendParent, spawn } from 'xstate'
import { assign as immerAssign } from '@xstate/immer'
import { Vector2 } from 'fsm/src/lib/vector'

import { DataChannelRequestType } from 'src/domain/DatachannelRequestType'
import {
    type HasMouseButtons,
    type HasCoordinates,
    type MouseMove,
    type HasMouseButton,
    type MouseWheel,
    MouseInputEventType,
    type MouseInputEvents,
    type MouseData,
} from './mouse.input.event'
import mouseListener from './mouse.input.listener'
import type { MouseInputContext } from './mouse.input.machine'
import {
    MouseButton,
    MouseButtonsMask,
    type NormalizationFunctions,
} from '../input.types'
import type { UnaryFunction } from 'rxjs'

const mouseEvent = (
    { normalizeAndQuantizeUnsigned }: NormalizationFunctions,
    type: DataChannelRequestType,
    button: number,
    coordinates: Vector2
): ArrayBufferLike => {
    const normalizedCoordinates = normalizeAndQuantizeUnsigned(coordinates)

    const data = new DataView(new ArrayBuffer(6))
    data.setUint8(0, type)
    data.setUint8(1, button)
    data.setUint16(2, normalizedCoordinates[0].x, true)
    data.setUint16(4, normalizedCoordinates[0].y, true)

    // console.debug(
    //     `make mouse event. type: ${type}; coordinates: ${coordinates.x},${coordinates.y}; normalized: ${normalizedCoordinates[0].x},${normalizedCoordinates[0].y}`
    // )
    return data.buffer
}

const mouseDownEvent = (
    normalizationFn: NormalizationFunctions,
    button: number,
    coordinates: Vector2
): ArrayBufferLike =>
    mouseEvent(
        normalizationFn,
        DataChannelRequestType.MouseDown,
        button,
        coordinates
    )

const mouseUpEvent = (
    normalizationFn: NormalizationFunctions,
    button: number,
    coordinates: Vector2
): ArrayBufferLike =>
    mouseEvent(
        normalizationFn,
        DataChannelRequestType.MouseUp,
        button,
        coordinates
    )

export const mouseInputActions = {
    sendToParent: sendParent(
        (_c: MouseInputContext, event: MouseInputEvents) => event
    ),

    // spawnMouseListener: assign({
    //     mouseListener: (context: MouseInputContext) =>
    //         spawn(mouseListener(context.playerElement)),
    // }),

    // Spawn an agent listening for mouse input events
    spawnMouseListener: immerAssign((context: MouseInputContext) => {
        const observable = mouseListener(context.videoElement)
        context.mouseListener = spawn(observable)
    }),

    mouseEnter: send(() => {
        const data = new DataView(new ArrayBuffer(1))
        data.setUint8(0, DataChannelRequestType.MouseEnter)
        return {
            type: MouseInputEventType.Data,
            data: [data.buffer],
        }
    }),

    mouseLeave: send((): MouseData => {
        const data = new DataView(new ArrayBuffer(1))
        // ? this looks like a bug
        // todo: investigate
        data.setUint8(0, DataChannelRequestType.MouseLeave)
        // data.setUint8(0, DataChannelRequestType.MouseEnter)
        return {
            type: MouseInputEventType.Data,
            data: [data.buffer],
        }
    }),

    mouseMove: send(
        (context: MouseInputContext, event: MouseInputEvents): MouseData => {
            const coordinates = context.mouseCoordinates
            const moveDelta = (event as MouseMove).delta

            // console.debug(`Mouse move at (${coordinates.x}, ${coordinates.y}) with delta (${moveDelta.x} ${moveDelta.y}),`)

            const normalizedCoordinates =
                context.normalizationFn!.normalizeAndQuantizeUnsigned(
                    coordinates
                )
            const normalizedDelta =
                context.normalizationFn!.normalizeAndQuantizeSigned(moveDelta)
            const data = new DataView(new ArrayBuffer(9))
            data.setUint8(0, DataChannelRequestType.MouseMove)
            data.setUint16(1, normalizedCoordinates[0].x, true)
            data.setUint16(3, normalizedCoordinates[0].y, true)
            data.setInt16(5, normalizedDelta.x, true)
            data.setInt16(7, normalizedDelta.y, true)

            return {
                type: MouseInputEventType.Data,
                data: [data.buffer],
            }
        }
    ),

    mouseDown: send(
        (context: MouseInputContext, event: MouseInputEvents): MouseData => {
            const button: number = (event as HasMouseButton).button
            const coordinates: Vector2 = (event as HasCoordinates).coordinates

            // console.debug(`Mouse button ${button} DOWN at (${coordinates.x}, ${coordinates.y})`)

            const data = mouseEvent(
                context.normalizationFn!,
                DataChannelRequestType.MouseDown,
                button,
                coordinates
            )
            return {
                type: MouseInputEventType.Data,
                data: [data],
            }
        }
    ),

    mouseUp: send(
        (context: MouseInputContext, event: MouseInputEvents): MouseData => {
            const button: number = (event as HasMouseButton).button
            const coordinates: Vector2 = (event as HasCoordinates).coordinates

            // console.debug(`Mouse button ${button} UP at (${coordinates.x}, ${coordinates.y})`)

            const data = mouseEvent(
                context.normalizationFn!,
                DataChannelRequestType.MouseUp,
                button,
                coordinates
            )
            return {
                type: MouseInputEventType.Data,
                data: [data],
            }
        }
    ),

    sendMouseWheel: send(
        (context: MouseInputContext, event: MouseInputEvents): MouseData => {
            const coordinates: Vector2 = (event as MouseWheel).coordinates
            const wheelDelta: number = (event as MouseWheel).delta

            // console.debug(`Mouse wheel with delta ${wheelDelta} at (${coordinates.x}, ${coordinates.y})`);

            const normalizedCoordinates =
                context.normalizationFn!.normalizeAndQuantizeUnsigned(
                    coordinates
                )
            const data = new DataView(new ArrayBuffer(7))
            data.setUint8(0, DataChannelRequestType.MouseWheel)
            data.setInt16(1, wheelDelta, true)
            data.setUint16(3, normalizedCoordinates[0].x, true)
            data.setUint16(5, normalizedCoordinates[0].y, true)

            return {
                type: MouseInputEventType.Data,
                data: [data.buffer],
            }
        }
    ),

    requestPointerLock: (context: MouseInputContext) => {
        console.debug('Video-player requesting pointerLock')
        context.videoElement.requestPointerLock()
    },

    setPointerLockCoordinates: immerAssign(
        (context: MouseInputContext, event: MouseInputEvents) => {
            const { coordinates } = event as HasCoordinates
            context.mouseCoordinates = coordinates
        }
    ),

    // setPointerLockCoordinates: assign({
    //     mouseCoordinates: (_context: any, event: MouseInputEvents) => {
    //         const { coordinates } = event as HasCoordinates
    //         return coordinates
    //     },
    // }),

    setLockState: assign({
        isLocked: (context: MouseInputContext) => {
            // console.debug(`Lock state: ${isLocked ? 'locked' : 'unlocked'}`)
            return document.pointerLockElement === context.videoElement
        },
    }),

    updateMousePosition: assign({
        mouseCoordinates: (
            context: MouseInputContext,
            event: MouseInputEvents
        ) => {
            const delta = (event as MouseMove).delta
            const newX = context.mouseCoordinates.x + delta.x
            const newY = context.mouseCoordinates.y + delta.y
            return new Vector2(newX, newY)
        },
    }),

    // checks whether any mouse buttons are 'down' and sends appropriate events
    clickMouseButtons: send(
        (context: MouseInputContext, event: MouseInputEvents): MouseData => {
            const buttons: number = (event as HasMouseButtons).buttons
            const coordinates: Vector2 = (event as HasCoordinates).coordinates

            const buttonData = buttonsAndMasks
                .map(({ mask, button }) => {
                    if (buttons & mask) {
                        return mouseDownEvent(
                            context.normalizationFn!,
                            button,
                            coordinates
                        )
                    }
                })
                .filter((value: ArrayBuffer | undefined) => value !== undefined)

            return {
                type: MouseInputEventType.Data,
                data: buttonData as Array<ArrayBufferLike>,
            }
        }
    ),

    releaseMouseButtons: send(
        (context: MouseInputContext, event: MouseInputEvents): MouseData => {
            const buttons: number = (event as HasMouseButtons).buttons
            const coordinates: Vector2 = (event as HasCoordinates).coordinates

            const buttonData = buttonsAndMasks
                .map(({ mask, button }) => {
                    if (buttons & mask) {
                        return mouseUpEvent(
                            context.normalizationFn!,
                            button,
                            coordinates
                        )
                    }
                })
                .filter((value: ArrayBuffer | undefined) => value !== undefined)

            return {
                type: MouseInputEventType.Data,
                data: buttonData as Array<ArrayBufferLike>,
            }
        }
    ),
}

const buttonsAndMasks = [
    {
        mask: MouseButtonsMask.PrimaryButton,
        button: MouseButton.MainButton,
    },
    {
        mask: MouseButtonsMask.SecondaryButton,
        button: MouseButton.SecondaryButton,
    },
    {
        mask: MouseButtonsMask.AuxiliaryButton,
        button: MouseButton.AuxiliaryButton,
    },
    {
        mask: MouseButtonsMask.FourthButton,
        button: MouseButton.FourthButton,
    },
    {
        mask: MouseButtonsMask.FifthButton,
        button: MouseButton.FifthButton,
    },
]
