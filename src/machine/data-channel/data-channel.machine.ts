import { createMachine, type ActorRef, type MachineConfig } from 'xstate'
import type { NormalizationFunctions } from '../input/input.types'
import type { DataChannelEvent } from './data-channel.event'

export type DataChannelContext = {
    dataChannel: RTCDataChannel
    listener?: ActorRef<DataChannelEvent>
}

export interface DataChannelStateSchema {
    states: {
        ok: {}
        error: {}
    }
}

const DataChannelMachineConfig = (
    dataChannel: RTCDataChannel
): MachineConfig<
    DataChannelContext,
    DataChannelStateSchema,
    DataChannelEvent
> => ({
    id: 'DataChannelMachine',
    schema: {
        context: {} as DataChannelContext,
        events: {} as DataChannelEvent,
    },
    context: {
        dataChannel,
        listener: undefined,
    },
    initial: 'ok',
    states: {
        ok: {},
        error: {},
    },
})

// export const makeMainMachine = (): StateMachine<MainContext, MainStateSchema, MainEvents> =>
export const makeDataChannelMachine = (dataChannel: RTCDataChannel) => {
    const configuration = DataChannelMachineConfig(dataChannel)

    return createMachine<DataChannelContext, DataChannelEvent>(
        configuration,
        {}
    )
}
