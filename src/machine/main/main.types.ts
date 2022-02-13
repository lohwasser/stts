import type { SvelteComponentDev } from 'svelte/internal'
import type { Readable } from 'svelte/store'
import type {
    ActionFunctionMap,
    ConditionPredicate,
    EventObject,
    Interpreter,
    MachineConfig,
    MachineOptions,
    ServiceConfig,
    State,
    StateMachine,
    StateNode,
    StateNodeConfig,
    StateSchema,
    StatesConfig,
    Typestate,
} from 'xstate'
import type { PixelstreamingEvent } from './main.events'
import type {
    PixelstreamingContext,
    PixelstreamingStates,
} from './main.machine'

export type XStateSvelteResponse<
    TContext,
    TEvent extends EventObject,
    TTypestate extends Typestate<TContext> = {
        value: any
        context: TContext
    }
> = {
    state: Readable<State<TContext, TEvent, unknown, TTypestate>>
    send: Interpreter<TContext, unknown, TEvent, TTypestate>['send']
    service: Interpreter<TContext, unknown, TEvent, TTypestate>
}

export type SvelteModule = typeof import('*.svelte')
export type SvelteComponent = SvelteComponentDev

export type MatchmakingError = {
    error: unknown
}

export type PixelstreamingMachine = StateMachine<
    PixelstreamingContext,
    PixelstreamingStates,
    PixelstreamingEvent
>
export type PixelstreamingConfig = MachineConfig<
    PixelstreamingContext,
    PixelstreamingStates,
    PixelstreamingEvent
>
export type PixelstreamingOptions = MachineOptions<
    PixelstreamingContext,
    PixelstreamingEvent
>
export type PixelstreamingFunctionMap = ActionFunctionMap<
    PixelstreamingContext,
    PixelstreamingEvent
>
export type PixelstreamingServiceRecord = Record<
    string,
    ServiceConfig<PixelstreamingContext, PixelstreamingEvent>
>
export type PixelstreamingStatesConfig = StatesConfig<
    PixelstreamingContext,
    PixelstreamingStates,
    PixelstreamingEvent
>
export type PixelstreamingStateSchema = StateSchema<PixelstreamingContext>
export type PixelstreamingConditionPredicate = ConditionPredicate<
    PixelstreamingContext,
    PixelstreamingEvent
>
export type PixelstreamingStateNode = StateNode<
    PixelstreamingContext,
    PixelstreamingStateSchema,
    PixelstreamingEvent
>
export type PixelstreamingStateNodeConfig = StateNodeConfig<
    PixelstreamingContext,
    PixelstreamingStateSchema,
    PixelstreamingEvent
>
export type PixelstreamingState = State<
    PixelstreamingContext,
    PixelstreamingEvent,
    PixelstreamingStateSchema
>
export type PixelstreamingTypestate = Typestate<PixelstreamingContext>
export type PixelstreamingXStateSvelteResponse = XStateSvelteResponse<
    PixelstreamingContext,
    PixelstreamingEvent,
    PixelstreamingTypestate
>

export type PixelstreamingSendFn = (
    event: PixelstreamingEvent,
    payload?: unknown
) => PixelstreamingState
