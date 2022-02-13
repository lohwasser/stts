import { assign, send } from 'xstate'
import type { Vector2 } from 'three'
import type { InputFunctionMap } from '../input.types'
import type { InputEvent } from '../input.events'
import type { InputContext } from '../input.machine'
import { VideoInputEventType } from './video.input.event'
import type { WebRTCStats } from '$lib/domain/webrtc'
import { DataChannelRequestType } from '$lib/domain/DatachannelRequestType'

// A generic message has a type and a descriptor.
function emitDescriptor(
    messageType: DataChannelRequestType,
    descriptor: unknown
): ArrayBufferLike {
    // Convert the dscriptor object into a JSON string.
    let descriptorAsString = JSON.stringify(descriptor)

    console.log('emitDescriptor', messageType, descriptorAsString)

    // Add the UTF-16 JSON string to the array byte buffer, going two bytes at  a time.
    const data = new DataView(
        new ArrayBuffer(1 + 2 + 2 * descriptorAsString.length)
    )
    let byteIdx = 0
    data.setUint8(byteIdx, messageType)
    byteIdx++
    data.setUint16(byteIdx, descriptorAsString.length, true)
    byteIdx += 2
    for (let i = 0; i < descriptorAsString.length; i++) {
        data.setUint16(byteIdx, descriptorAsString.charCodeAt(i), true)
        byteIdx += 2
    }

    return data.buffer
}

const generateUIInteraction = (descriptor): ArrayBufferLike =>
    emitDescriptor(DataChannelRequestType.UIInteraction, descriptor)

const generateCommand = (descriptor): ArrayBufferLike =>
    emitDescriptor(DataChannelRequestType.Command, descriptor)

export const videoInputActions: InputFunctionMap = {
    updatePlayerElementSize: assign({
        playerElement: (context: InputContext, event: InputEvent) => {
            const { stats } = event as WebRTCStats
            const videoResolution: Vector2 = stats.videoResolution
            const ratio: number = videoResolution.x / videoResolution.y

            const mainElement = document.getElementById('svelte')
            const maxWidth = mainElement.clientWidth * 0.8

            let { width, height } = videoResolution
            if (width > maxWidth) {
                width = maxWidth
                height = maxWidth / ratio
            }

            // context.playerElement.setAttribute("width", `${width}`)
            // context.playerElement.setAttribute("height", `${height}`)
            context.playerElement.style.width = `${width}px`
            context.playerElement.style.height = `${height}px`

            console.log('videoResolution', videoResolution)
            console.log('Set player element size', width, height)

            return context.playerElement
        },
    }),

    triggerNormalization: send(() => ({
        type: VideoInputEventType.NormalizeAndQuantize,
    })),

    requestQualityControl: (context: InputContext) => {
        const data = new Uint8Array([
            DataChannelRequestType.RequestQualityControl,
        ])
        console.log('requesting quality control', data)
        context.dataChannel.send(data.buffer)
    },

    updateVideoStreamSize: (context: InputContext) => {
        const width = context.playerElement.clientWidth
        const height = context.playerElement.clientHeight
        const descriptor = { Console: `setres ${width}x${height}` }
        console.log('updateVideoStreamSize', descriptor)

        context.dataChannel.send(generateUIInteraction(descriptor))
    },

    // resizePlayerStyleToFillWindow: () => console.log('resizePlayerStyleToFillWindow'),
    // resizePlayerStyleToActualSize: () => console.log('resizePlayerStyleToActualSize'),
    // resizePlayerStyleToArbitrarySize: () => console.log('resizePlayerStyleToArbitrarySize'),

    emitFPS: (context: InputContext) => {
        const descriptor = { Console: 'stat fps' }
        console.log('emitFPS', descriptor)
        context.dataChannel.send(generateUIInteraction(descriptor))
    },

    // adjustResolution: send((context: InputContext) => {

    //     const width = context.playerElement.clientWidth
    //     const height = context.playerElement.clientHeight

    //     const descriptor = { Console: `setres ${width}x${height}`}
    //     console.log('adjustResolution', descriptor)
    //     return { type: BaseInputEventType.UiInteraction, descriptor }
    // }),

    prioritiseQuality: (context: InputContext) => {
        const descriptor = {
            Console: 'Streamer.PrioritiseQuality 1',
        }
        context.dataChannel.send(generateUIInteraction(descriptor))
    },

    lowBitrate: (context: InputContext) => {
        const lowBitrate = 2000
        const descriptor = {
            Console: `Streamer.LowBitrate ${lowBitrate}`,
        }
        context.dataChannel.send(generateUIInteraction(descriptor))
    },

    highBitrate: (context: InputContext) => {
        const highBitrate = 5000
        const descriptor = {
            Console: `Streamer.HighBitrate ${highBitrate}`,
        }
        context.dataChannel.send(generateUIInteraction(descriptor))
    },

    minFPS: (context: InputContext) => {
        const minFPS = 15
        const descriptor = {
            Console: `Streamer.MinFPS ${minFPS}`,
        }
        context.dataChannel.send(generateUIInteraction(descriptor))
    },
}

// const sendQualityConsoleCommands = (descriptor) => {
//     if (descriptor.PrioritiseQuality !== null) {
//         let command = 'Streamer.PrioritiseQuality ' + descriptor.PrioritiseQuality;
//         let consoleDescriptor = {
//             Console: command
//         };
//         generateUIInteraction(consoleDescriptor);
//     }

//     if (descriptor.LowBitrate !== null) {
//         let command = 'Streamer.LowBitrate ' + descriptor.LowBitrate;
//         let consoleDescriptor = {
//             Console: command
//         };
//         generateUIInteraction(consoleDescriptor);
//     }

//     if (descriptor.HighBitrate !== null) {
//         let command = 'Streamer.HighBitrate ' + descriptor.HighBitrate;
//         let consoleDescriptor = {
//             Console: command
//         };
//         generateUIInteraction(consoleDescriptor);
//     }

//     if (descriptor.MinFPS !== null) {
//         var command = 'Streamer.MinFPS ' + descriptor.MinFPS;
//         let consoleDescriptor = {
//             Console: command
//         };
//         generateUIInteraction(consoleDescriptor);
//     }
// }
