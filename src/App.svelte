<script lang="ts" context="module">
    // The xState state-machine
    // ————————————————————————
    // Anything having to do with state is handled by our statemachine.
    // We can send messages (Events) to the machine.
    // We can subscribe to to the machine-sate as a svelte-kit-store.
    let send
    let state
    export async function load({ page, fetch, session, context }) {
        send = context.send
        state = context.state
        return true
    }
</script>

<script lang="ts">
    import { onMount } from 'svelte'

    import Tailwind from './Tailwind.svelte'
    import Header from './components/Header.svelte'
    import Error from './components/Error.svelte'
    import Inspector from './components/Inspector.svelte'
    import PlayButton from './components/PlayButton.svelte'

    // The video player element
    let playerElement: HTMLVideoElement
    let playButtonFrame: HTMLDivElement
    let videoFrame: HTMLDivElement

    // error handling
    $: error = $state.context.error

    const play = () => {
        console.log('click:play')
        send({ type: 'pixelstreaming_play' })
    }

    const reset = () => {
        console.log('click:reset')
        send({ type: 'pixelstreaming_reset' })
    }

    onMount(() => {
        // we need to inialize inside onMount, because we need the playerHtmlElement
        // to be available
        send({ type: 'pixelstreaming_initialize', playerElement })
    })
</script>

<Tailwind />

<main>
    <Header />

    {#if error}
        <Error message={error.type} on:reset={reset} />
    {:else}
        {#if $state.value !== 'playing'}
            <div id="play-button-frame" bind:this={playButtonFrame}>
                <PlayButton hexColor="#242424" on:click={play} />
            </div>
        {/if}

        <div id="video-frame" bind:this={videoFrame}>
            <!-- svelte-ignore a11y-media-has-caption -->
            <video bind:this={playerElement} id="streamingVideo" />
        </div>

        <div id="stats-frame">
            <Inspector object={$state.context.videoStats} name={$state.value} />
        </div>
    {/if}
</main>

<style>
    :root {
        --svelte-rgb: 255, 62, 0;
    }

    html,
    body {
        position: relative;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
    }

    body {
        display: flex;
    }

    main {
        @apply w-full h-full;
        @apply flex justify-center items-center;
        @apply relative;
        @apply overflow-hidden;
    }

    #stats-frame {
        @apply absolute w-screen z-0;
        @apply flex-initial;
        @apply bottom-0;
    }

    #video-frame {
        @apply z-40;
        @apply overflow-hidden;
    }

    #play-button-frame {
        @apply fixed z-50 flex justify-center items-center;
    }

    video {
        @apply shadow-xl rounded-sm;
        @apply border border-black border-solid;
        width: 800px;
        height: 600px;
    }
</style>
