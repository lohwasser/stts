import { DataChannelRequestType } from "./data-channel.types";

// A generic message has a type and a descriptor.
const _descriptor = (messageType: DataChannelRequestType, descriptor: unknown): ArrayBufferLike {
    // Convert the descriptor object into a JSON string.
    let descriptorAsString = JSON.stringify(descriptor);

    console.log('generate descriptor', messageType, descriptorAsString)

    // Add the UTF-16 JSON string to the array byte buffer, going two bytes at  a time.
    const data = new DataView(new ArrayBuffer(1 + 2 + 2 * descriptorAsString.length))
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

export const uiDescriptor = (descriptor: unknown): ArrayBufferLike =>
    _descriptor(DataChannelRequestType.UIInteraction, descriptor)

export const commandDescriptor = (descriptor: unknown): ArrayBufferLike =>
    _descriptor(DataChannelRequestType.Command, descriptor)
