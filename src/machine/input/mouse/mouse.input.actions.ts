import { assign, sendParent, spawn } from 'xstate'
import type { Vector2 } from 'three'
import {
    InputFunctionMap,
    MouseButton,
    MouseButtonsMask,
    NormalizationFunctions,
} from '../input.types'
import type { InputEvent } from '../input.events'
import type {
    HasMouseButtons,
    HasCoordinates,
    MouseMove,
    HasMouseButton,
    MouseWheel,
} from './mouse.input.event'
import type { InputContext } from '../input.machine'
import mouseListener from './mouse.input.listener'
import { DataChannelRequestType } from '$lib/domain/DatachannelRequestType'

const makeMouseEvent = (
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

const makeMouseDownEvent = (
    normalizationFn: NormalizationFunctions,
    button: number,
    coordinates: Vector2
): ArrayBufferLike =>
    makeMouseEvent(
        normalizationFn,
        DataChannelRequestType.MouseDown,
        button,
        coordinates
    )

const makeMouseUpEvent = (
    normalizationFn: NormalizationFunctions,
    button: number,
    coordinates: Vector2
): ArrayBufferLike =>
    makeMouseEvent(
        normalizationFn,
        DataChannelRequestType.MouseUp,
        button,
        coordinates
    )

export const mouseInputActions: InputFunctionMap = {
    spawnMouseListener: assign({
        mouseListener: (context: InputContext) =>
            spawn(mouseListener(context.playerElement)),
    }),

    sendMouseEnterEvent: (context: InputContext) => {
        const data = new DataView(new ArrayBuffer(1))
        data.setUint8(0, DataChannelRequestType.MouseEnter)
        context.dataChannel.send(data.buffer)
    },

    sendMouseLeaveEvent: (context: InputContext) => {
        // console.log('sendMouseLeaveEvent')
        const data = new DataView(new ArrayBuffer(1))
        data.setUint8(0, DataChannelRequestType.MouseLeave)
        data.setUint8(0, DataChannelRequestType.MouseEnter)
        context.dataChannel.send(data.buffer)
    },

    pressMouseButtons: (context: InputContext, event: InputEvent) => {
        const buttons: number = (event as HasMouseButtons).buttons
        const coordinates: Vector2 = (event as HasCoordinates).coordinates

        // console.debug('pressMouseButtons', JSON.stringify(event))

        if (buttons & MouseButtonsMask.PrimaryButton) {
            const data = makeMouseDownEvent(
                context.normalizationFn,
                MouseButton.MainButton,
                coordinates
            )
            context.dataChannel.send(data)
        }

        if (buttons & MouseButtonsMask.SecondaryButton) {
            const data = makeMouseDownEvent(
                context.normalizationFn,
                MouseButton.SecondaryButton,
                coordinates
            )
            context.dataChannel.send(data)
        }

        if (buttons & MouseButtonsMask.AuxiliaryButton) {
            const data = makeMouseDownEvent(
                context.normalizationFn,
                MouseButton.AuxiliaryButton,
                coordinates
            )
            context.dataChannel.send(data)
        }

        if (buttons & MouseButtonsMask.FourthButton) {
            const data = makeMouseDownEvent(
                context.normalizationFn,
                MouseButton.FourthButton,
                coordinates
            )
            context.dataChannel.send(data)
        }
        if (buttons & MouseButtonsMask.FifthButton) {
            const data = makeMouseDownEvent(
                context.normalizationFn,
                MouseButton.FifthButton,
                coordinates
            )
            context.dataChannel.send(data)
        }
    },

    releaseMouseButtons: (context: InputContext, event: InputEvent) => {
        const buttons: number = (event as HasMouseButtons).buttons
        const coordinates: Vector2 = (event as HasCoordinates).coordinates

        // console.debug('releaseMouseButtons', JSON.stringify(event))

        if (buttons & MouseButtonsMask.PrimaryButton) {
            const data = makeMouseUpEvent(
                context.normalizationFn,
                MouseButton.MainButton,
                coordinates
            )
            context.dataChannel.send(data)
        }

        if (buttons & MouseButtonsMask.SecondaryButton) {
            const data = makeMouseUpEvent(
                context.normalizationFn,
                MouseButton.SecondaryButton,
                coordinates
            )
            context.dataChannel.send(data)
        }

        if (buttons & MouseButtonsMask.AuxiliaryButton) {
            const data = makeMouseUpEvent(
                context.normalizationFn,
                MouseButton.AuxiliaryButton,
                coordinates
            )
            context.dataChannel.send(data)
        }

        if (buttons & MouseButtonsMask.FourthButton) {
            const data = makeMouseUpEvent(
                context.normalizationFn,
                MouseButton.FourthButton,
                coordinates
            )
            context.dataChannel.send(data)
        }

        if (buttons & MouseButtonsMask.FifthButton) {
            const data = makeMouseUpEvent(
                context.normalizationFn,
                MouseButton.FifthButton,
                coordinates
            )
            context.dataChannel.send(data)
        }
    },

    requestPointerLock: (context: InputContext) => {
        // console.debug('Video-player requesting pointerLock')
        context.playerElement.requestPointerLock()
    },

    setPointerLockCoordinates: assign({
        mouseCoordinates: (context: InputContext, event: InputEvent) => {
            const { coordinates } = event as HasCoordinates
            return coordinates
        },
    }),

    setLockState: assign({
        isLocked: (context: InputContext) => {
            const isLocked =
                document.pointerLockElement === context.playerElement
            // console.debug(`Lock state: ${isLocked ? 'locked' : 'unlocked'}`)
            return isLocked
        },
    }),

    updateMousePosition: assign({
        mouseCoordinates: (context: InputContext, event: InputEvent) => {
            const delta = (event as MouseMove).delta
            const newX = context.mouseCoordinates.x + delta.x
            const newY = context.mouseCoordinates.y + delta.y
            return { x: newX, y: newY }
        },
    }),

    sendMouseMove: (context: InputContext, event: InputEvent) => {
        const coordinates = context.mouseCoordinates
        const moveDelta = (event as MouseMove).delta

        // console.debug(`Mouse move at (${coordinates.x}, ${coordinates.y}) with delta (${moveDelta.x} ${moveDelta.y}),`)

        const normalizedCoordinates =
            context.normalizationFn.normalizeAndQuantizeUnsigned(coordinates)
        const normalizedDelta =
            context.normalizationFn.normalizeAndQuantizeSigned(moveDelta)
        const data = new DataView(new ArrayBuffer(9))
        data.setUint8(0, DataChannelRequestType.MouseMove)
        data.setUint16(1, normalizedCoordinates[0].x, true)
        data.setUint16(3, normalizedCoordinates[0].y, true)
        data.setInt16(5, normalizedDelta.x, true)
        data.setInt16(7, normalizedDelta.y, true)

        context.dataChannel.send(data.buffer)
    },

    sendMouseDown: (context: InputContext, event: InputEvent) => {
        const button: number = (event as HasMouseButton).button
        const coordinates: Vector2 = (event as HasCoordinates).coordinates

        // console.debug(`Mouse button ${button} DOWN at (${coordinates.x}, ${coordinates.y})`)

        const data = makeMouseEvent(
            context.normalizationFn,
            DataChannelRequestType.MouseDown,
            button,
            coordinates
        )
        context.dataChannel.send(data)
    },

    sendMouseUp: (context: InputContext, event: InputEvent) => {
        const button: number = (event as HasMouseButton).button
        const coordinates: Vector2 = (event as HasCoordinates).coordinates

        // console.debug(`Mouse button ${button} UP at (${coordinates.x}, ${coordinates.y})`)

        const data = makeMouseEvent(
            context.normalizationFn,
            DataChannelRequestType.MouseUp,
            button,
            coordinates
        )
        context.dataChannel.send(data)
    },

    sendMouseWheel: (context, event: InputEvent) => {
        const coordinates: Vector2 = (event as MouseWheel).coordinates
        const wheelDelta: number = (event as MouseWheel).delta

        // console.debug(`Mouse wheel with delta ${wheelDelta} at (${coordinates.x}, ${coordinates.y})`);

        const normalizedCoordinates =
            context.normalizationFn.normalizeAndQuantizeUnsigned(coordinates)
        const data = new DataView(new ArrayBuffer(7))
        data.setUint8(0, DataChannelRequestType.MouseWheel)
        data.setInt16(1, wheelDelta, true)
        data.setUint16(3, normalizedCoordinates[0].x, true)
        data.setUint16(5, normalizedCoordinates[0].y, true)

        context.dataChannel.send(data.buffer)
    },
}
