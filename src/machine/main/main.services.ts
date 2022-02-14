// const instanceAvailable = (response: any | MatchmakingError): boolean =>
//     (response as MatchmakingError).error === undefined

import type { MainContext } from './main.machine'

export default {
    playVideo: async (context: MainContext): Promise<void> => {
        return context.videoElement!.play()
    },
}
