export const inputStates = {
    ok: {
        entry: ['setupNormalizeAndQuantize'],
        type: 'parallel',
        states: {
            mouse: {
                invoke: [
                    { src: 'listenToMouseEnterAndLeaveEvents' },

                    // Obacht! hardcoded control scheme
                    // TODO: use context.controlScheme (cond: 'lockedMouseControllScheme')
                    { src: 'listenToLockedMouseEvents' },
                ],
                initial: 'unknown',
                states: {
                    unknown: {
                        on: {
                            MOUSE_ENTER: 'over',
                            MOUSE_LEAVE: 'outside',
                        },
                    },
                    over: {
                        entry: ['sendMouseEnterEvent', 'pressMouseButtons'],
                        on: {
                            MOUSE_LEAVE: 'outside',
                            REQUEST_POINTER_LOCK: {
                                actions: [
                                    'requestPointerLock',
                                    'setPointerLockCoordinates',
                                ],
                            },
                            LOCK_STATE_CHANGE: { actions: ['setLockState'] },
                            MOUSE_MOVE: {
                                actions: [
                                    'updateMousePosition',
                                    'sendMouseMove',
                                ],
                                cond: 'isPointerLocked',
                            },
                            MOUSE_DOWN: {
                                actions: 'sendMouseDown',
                                cond: 'isPointerLocked',
                            },
                            MOUSE_UP: {
                                actions: 'sendMouseUp',
                                cond: 'isPointerLocked',
                            },
                            MOUSE_WHEEL: {
                                actions: 'sendMouseWheel',
                                cond: 'isPointerLocked',
                            },
                        },
                    },
                    outside: {
                        entry: ['sendMouseLeaveEvent', 'releaseMouseButtons'],
                        on: {
                            MOUSE_ENTER: 'over',
                        },
                    },
                },
            },
            keyboard: {
                invoke: { src: 'listenToKeyboard' },
                on: {
                    KEY_DOWN: { actions: ['sendKeyDown'] },
                    KEY_UP: { actions: ['sendKeyUp'] },
                    KEY_PRESS: { actions: ['sendKeyPress'] },
                },
            },
            video: {
                // entry: 'emitFPS',
                initial: 'initial',
                states: {
                    initial: {
                        on: {
                            // [PeerConnectionMessageType.WebRtcStats]: {
                            //     actions: 'adjustResolution',
                            //     target: 'adjusted'
                            // },
                        },
                    },
                    adjusted: {
                        entry: () => console.log('video adjusted'),
                    },
                },
            },
        },
        on: {
            // UI_INTERACTION: { actions: 'emitUIInteraction'},
            // [BaseInputEventType.InputDescriptor]: { actions: 'relayToParent'},
        },
    },
    error: {
        id: 'error',
        type: 'final',
    },
}
