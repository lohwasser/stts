import { Vector2 } from 'fsm/src/lib/vector'
import { createMachine, type ActorRef, type MachineConfig } from 'xstate'
import { ControlSchemeType, type NormalizationFunctions } from '../input.types'
import { MouseInputEventType, type MouseInputEvents } from './mouse.input.event'

import actions from './mouse.input.actions'

export type MouseInputContext = {
    videoElement: HTMLVideoElement

    // The control scheme controls the behavior of the mouse when it interacts
    // with the WebRTC player.
    controlScheme: ControlSchemeType

    // UE4 has a fake touches option which fakes a single finger touch when the
    // user drags with their mouse. We may perform the reverse a single finger
    // touch may be converted into a mouse drag UE4 side. This allows a
    // non-touch application to be controlled partially via a touch device.
    fakeMouseWithTouches: boolean

    mouseCoordinates: Vector2
    isLocked: boolean

    normalizationFn?: NormalizationFunctions
    mouseListener?: ActorRef<MouseInputEvents>
}

export interface MouseInputStateSchema {
    states: {
        unknown: {}
        over: {}
        outside: {}
        error: {}
    }
}

const inputMachineConfig = (
    playerElement: HTMLVideoElement
): MachineConfig<
    MouseInputContext,
    MouseInputStateSchema,
    MouseInputEvents
> => ({
    id: 'mouse-input',
    schema: {
        context: {} as MouseInputContext,
        events: {} as MouseInputEvents,
    },
    context: {
        videoElement: playerElement,
        controlScheme: ControlSchemeType.LockedMouse,
        fakeMouseWithTouches: false,
        mouseCoordinates: new Vector2(0, 0),
        isLocked: false,

        normalizationFn: undefined,
        mouseListener: undefined,
    },
    entry: ['setupNormalizeAndQuantize', 'spawnMouseListener'],
    initial: 'unknown',
    states: {
        unknown: {
            on: {
                [MouseInputEventType.Enter]: { target: 'over' },
                [MouseInputEventType.Leave]: { target: 'outside' },
            },
        },
        over: {
            entry: ['mouseEnter', 'clickMouseButtons'],
            on: {
                [MouseInputEventType.Leave]: 'outside',

                [MouseInputEventType.RequestPointerLock]: {
                    actions: [
                        'requestPointerLock',
                        'setPointerLockCoordinates',
                    ],
                },
                [MouseInputEventType.LockStateChange]: {
                    actions: ['setLockState'],
                },
                [MouseInputEventType.Move]: {
                    actions: ['updateMousePosition', 'mouseMove'],
                    cond: 'isPointerLocked',
                },
                [MouseInputEventType.Down]: {
                    actions: 'mouseDown',
                    cond: 'isPointerLocked',
                },
                [MouseInputEventType.Up]: {
                    actions: 'mouseUp',
                    cond: 'isPointerLocked',
                },
                [MouseInputEventType.Wheel]: {
                    actions: 'mouseWheel',
                    cond: 'isPointerLocked',
                },

                [MouseInputEventType.Data]: {
                    actions: 'sendToParent',
                },
            },
        },
        outside: {
            entry: ['sendMouseLeaveEvent', 'releaseMouseButtons'],
            on: {
                [MouseInputEventType.Enter]: 'over',
            },
        },
        error: {
            id: 'error',
            type: 'final',
        },
    },
})

export const makeMouseInputMachine = (videoElement: HTMLVideoElement) =>
    createMachine<MouseInputContext, MouseInputEvents>(
        inputMachineConfig(videoElement),
        { actions }
    )
