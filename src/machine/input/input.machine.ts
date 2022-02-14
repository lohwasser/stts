import { type ActorRef, createMachine, type MachineConfig } from 'xstate'
import { ControlSchemeType, type NormalizationFunctions } from './input.types'
import { baseInputActions } from './base/base.input.actions'
import { inputGuards } from './input.guards'
import keyboardActions from './keyboard/keyboard.input.actions'
import keyboardServices from './keyboard/keyboard.input.services'
import { mouseInputActions } from './mouse/mouse.input.actions'
import { mouseInputServices } from './mouse/mouse.input.services'
import { videoInputActions } from './video/video.input.actions'
import type { InputEvents } from './input.events'
import {
    KeyboardInputEventType,
    type KeyboardInputEvents,
} from './keyboard/keyboard.input.event'
import {
    MouseInputEventType,
    type MouseInputEvents,
} from './mouse/mouse.input.event'
import { Vector2 } from 'fsm/src/lib/vector'

export type InputContext = {
    playerElement: HTMLVideoElement

    // The control scheme controls the behavior of the mouse when it interacts
    // with the WebRTC player.
    controlScheme: ControlSchemeType

    // Browser keys are those which are typically used by the browser UI. We
    // usually want to suppress these to allow, for example, UE4 to show shader
    // complexity with the F5 key without the web page refreshing.
    suppressBrowserKeys: boolean

    // UE4 has a fake touches option which fakes a single finger touch when the
    // user drags with their mouse. We may perform the reverse a single finger
    // touch may be converted into a mouse drag UE4 side. This allows a
    // non-touch application to be controlled partially via a touch device.
    fakeMouseWithTouches: boolean

    mouseCoordinates: Vector2
    isLocked: boolean

    peerConnection?: RTCPeerConnection
    dataChannel?: RTCDataChannel
    normalizationFn?: NormalizationFunctions
    keyboardListener?: ActorRef<KeyboardInputEvents>
    mouseListener?: ActorRef<MouseInputEvents>
    statsCollector?: ActorRef<WebRTCStats>
}

export interface InputStateSchema {
    states: {
        ok: {
            states: {
                mouse: {
                    states: {
                        unknown: {}
                        over: {}
                        outside: {}
                    }
                }
                keyboard: {}
                // video: InputStateSchema
            }
        }
        error: {}
    }
}

const inputMachineConfig = (
    playerElement: HTMLVideoElement
): MachineConfig<InputContext, InputStateSchema, InputEvents> => ({
    id: 'InputMachine',
    schema: {
        context: {} as InputContext,
        events: {} as InputEvents,
    },
    context: {
        playerElement,
        controlScheme: ControlSchemeType.LockedMouse,
        suppressBrowserKeys: true,
        fakeMouseWithTouches: false,
        mouseCoordinates: new Vector2(0, 0),
        isLocked: false,

        peerConnection: undefined,
        dataChannel: undefined,
        normalizationFn: undefined,
        keyboardListener: undefined,
        mouseListener: undefined,
        statsCollector: undefined,
    },
    initial: 'ok',
    states: {
        ok: {
            id: 'ok',
            entry: ['setupNormalizeAndQuantize'],
            type: 'parallel',
            states: {
                mouse: {
                    entry: 'spawnMouseListener',
                    initial: 'unknown',
                    states: {
                        unknown: {
                            on: {
                                [MouseInputEventType.Enter]: 'over',
                                [MouseInputEventType.Leave]: 'outside',
                            },
                        },
                        over: {
                            entry: ['sendMouseEnterEvent', 'pressMouseButtons'],
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
                                    actions: [
                                        'updateMousePosition',
                                        'sendMouseMove',
                                    ],
                                    cond: 'isPointerLocked',
                                },
                                [MouseInputEventType.Down]: {
                                    actions: 'sendMouseDown',
                                    cond: 'isPointerLocked',
                                },
                                [MouseInputEventType.Up]: {
                                    actions: 'sendMouseUp',
                                    cond: 'isPointerLocked',
                                },
                                [MouseInputEventType.Wheel]: {
                                    actions: 'sendMouseWheel',
                                    cond: 'isPointerLocked',
                                },
                            },
                        },
                        outside: {
                            entry: [
                                'sendMouseLeaveEvent',
                                'releaseMouseButtons',
                            ],
                            on: {
                                [MouseInputEventType.Enter]: 'over',
                            },
                        },
                    },
                },
                keyboard: {
                    entry: 'spawnKeyboardListener',
                    on: {
                        [KeyboardInputEventType.Down]: {
                            actions: ['sendKeyDown'],
                        },
                        [KeyboardInputEventType.Up]: { actions: ['sendKeyUp'] },
                        [KeyboardInputEventType.Press]: {
                            actions: ['sendKeyPress'],
                        },
                    },
                },
            },
        },
        error: {
            id: 'error',
            type: 'final',
        },
    },
})

// export const makeMainMachine = (): StateMachine<MainContext, MainStateSchema, MainEvents> =>
export const makeInputMachine = (videoElement: HTMLVideoElement) => {
    const configuration = inputMachineConfig(videoElement)

    return createMachine<InputContext, InputEvents>(configuration, {
        actions: {
            ...baseInputActions,
            ...mouseInputActions,
            ...keyboardActions,
            ...videoInputActions,
        },
        services: { ...mouseInputServices, ...keyboardServices },
        guards: inputGuards,
    })
}
