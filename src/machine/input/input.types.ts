import type { Vector2 } from 'fsm/src/lib/vector'

export type Ranged = {
    inRange: boolean
}

export type NormalizationFunctions = {
    normalizeAndQuantizeUnsigned: ({ x, y }: Vector2) => [Vector2, Ranged]
    unquantizeAndDenormalizeUnsigned: ({ x, y }: Vector2) => Vector2
    normalizeAndQuantizeSigned: ({ x, y }: Vector2) => Vector2
}

export enum ControlSchemeType {
    // A mouse can lock inside the WebRTC player so the user can simply move the
    // mouse to control the orientation of the camera. The user presses the
    // Escape key to unlock the mouse.
    LockedMouse = 0,

    // A mouse can hover over the WebRTC player so the user needs to click and
    // drag to control the orientation of the camera.
    HoveringMouse = 1,
}

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
export enum MouseButton {
    MainButton = 0, // Left button.
    AuxiliaryButton = 1, // Wheel button.
    SecondaryButton = 2, // Right button.
    FourthButton = 3, // Browser Back button.
    FifthButton = 4, // Browser Forward button.
}

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
export enum MouseButtonsMask {
    PrimaryButton = 1, // Left button.
    SecondaryButton = 2, // Right button.
    AuxiliaryButton = 4, // Wheel button.
    FourthButton = 8, // Browser Back button.
    FifthButton = 16, // Browser Forward button.
}

// Must be kept in sync with JavaScriptKeyCodeToFKey C++ array. The index of the
// entry in the array is the special key code given below.
export enum SpecialKeyCodes {
    BackSpace = 8,
    Shift = 16,
    Control = 17,
    Alt = 18,
    RightShift = 253,
    RightControl = 254,
    RightAlt = 255,
}

// export type InputMachine = StateMachine<InputContext, InputStates, InputEvent>
// export type InputConfig = MachineConfig<InputContext, InputStates, InputEvent>
// export type InputOptions = MachineOptions<InputContext, InputEvent>
// export type InputFunctionMap = ActionFunctionMap<InputContext, InputEvent>
// export type InputServiceRecord = Record<string, ServiceConfig<InputContext, InputEvent>>
// export type InputStatesConfig = StatesConfig<InputContext, InputStates, InputEvent>
// export type InputStateSchema = StateSchema<InputContext>
// export type InputConditionPredicate = ConditionPredicate<InputContext, InputEvent>
// export type InputStateNode = StateNode<InputContext, InputStateSchema, InputEvent>
// export type InputState = State<InputContext, InputEvent, InputStateSchema>
// export type InputTypestate = Typestate<InputContext>
// export type InputSendFn = (event: InputEvent, payload?: unknown) => InputState
