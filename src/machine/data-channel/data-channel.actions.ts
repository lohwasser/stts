import { uiDescriptor } from './data-channel.descriptor'
import type { DataChannelContext } from './data-channel.machine'

export default {
    // triggerNormalization: send(() => ({
    //     type: VideoInputEventType.NormalizeAndQuantize,
    // })),

    requestQualityControl: (context: DataChannelContext) => {
        // const data = new Uint8Array([
        //     DataChannelRequestType.RequestQualityControl,
        // ])
        // console.log('requesting quality control', data)
        // context.dataChannel.send(data.buffer)
    },

    updateVideoStreamSize: (context: DataChannelContext) => {
        // const width = context.playerElement.clientWidth
        // const height = context.playerElement.clientHeight
        // const descriptor = { Console: `setres ${width}x${height}` }
        // console.log('updateVideoStreamSize', descriptor)
        // context.dataChannel.send(uiDescriptor(descriptor))
    },

    // resizePlayerStyleToFillWindow: () => console.log('resizePlayerStyleToFillWindow'),
    // resizePlayerStyleToActualSize: () => console.log('resizePlayerStyleToActualSize'),
    // resizePlayerStyleToArbitrarySize: () => console.log('resizePlayerStyleToArbitrarySize'),

    emitFPS: (context: DataChannelContext) => {
        // const descriptor = { Console: 'stat fps' }
        // console.log('emitFPS', descriptor)
        // context.dataChannel.send(uiDescriptor(descriptor))
    },

    // adjustResolution: send((context: DataChannelContext) => {

    //     const width = context.playerElement.clientWidth
    //     const height = context.playerElement.clientHeight

    //     const descriptor = { Console: `setres ${width}x${height}`}
    //     console.log('adjustResolution', descriptor)
    //     return { type: BaseInputEventType.UiInteraction, descriptor }
    // }),

    prioritiseQuality: (context: DataChannelContext) => {
        const descriptor = {
            Console: 'Streamer.PrioritiseQuality 1',
        }
        context.dataChannel.send(uiDescriptor(descriptor))
    },

    lowBitrate: (context: DataChannelContext) => {
        const lowBitrate = 2000
        const descriptor = {
            Console: `Streamer.LowBitrate ${lowBitrate}`,
        }
        context.dataChannel.send(uiDescriptor(descriptor))
    },

    highBitrate: (context: DataChannelContext) => {
        const highBitrate = 5000
        const descriptor = {
            Console: `Streamer.HighBitrate ${highBitrate}`,
        }
        context.dataChannel.send(uiDescriptor(descriptor))
    },

    minFPS: (context: DataChannelContext) => {
        const minFPS = 15
        const descriptor = {
            Console: `Streamer.MinFPS ${minFPS}`,
        }
        context.dataChannel.send(uiDescriptor(descriptor))
    },
}

// const sendQualityConsoleCommands = (descriptor) => {
//     if (descriptor.PrioritiseQuality !== null) {
//         let command = 'Streamer.PrioritiseQuality ' + descriptor.PrioritiseQuality;
//         let consoleDescriptor = {
//             Console: command
//         };
//         uiDescriptor(consoleDescriptor);
//     }

//     if (descriptor.LowBitrate !== null) {
//         let command = 'Streamer.LowBitrate ' + descriptor.LowBitrate;
//         let consoleDescriptor = {
//             Console: command
//         };
//         uiDescriptor(consoleDescriptor);
//     }

//     if (descriptor.HighBitrate !== null) {
//         let command = 'Streamer.HighBitrate ' + descriptor.HighBitrate;
//         let consoleDescriptor = {
//             Console: command
//         };
//         uiDescriptor(consoleDescriptor);
//     }

//     if (descriptor.MinFPS !== null) {
//         var command = 'Streamer.MinFPS ' + descriptor.MinFPS;
//         let consoleDescriptor = {
//             Console: command
//         };
//         uiDescriptor(consoleDescriptor);
//     }
// }
