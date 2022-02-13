<script lang="ts">
    import { createEventDispatcher } from "svelte"
    import Metaballs from '$lib/components/Metaballs.svelte'

    const dispatch = createEventDispatcher()

    export let message: string

    const reset = () => {
        dispatch("reset")
    }
</script>

<div class="error">
    <div class="metalls-wrapper">
        <Metaballs/>
    </div>
    
    <div class="content"> 
        <div class="title" >
            {message} 
        </div>
        <div class="button-wrap" >
            <button on:click={reset}>reset</button>
        </div>
    </div>
</div>

<style type="text/scss">

    .error {
        @apply flex flex-col;
        @apply bg-gray-900;
        @apply justify-center;
        @apply items-center;
        // filter: hue-rotate(80deg);   
    }

    .metalls-wrapper {
        @apply flex;
        @apply fixed inset-0;
        @apply z-0;
        filter: hue-rotate(180deg);
        // @apply animate-rainbow;
        animation: rainbow 24s infinite;

    }

    .content {
        @apply p-12;
        @apply flex-initial;
        @apply flex flex-col;
        @apply z-10;
        // @apply bg-gray-300;

        @apply backdrop-filter backdrop-invert backdrop-grayscale backdrop-blur-md backdrop-contrast-200;
    }

    .title {
        @apply flex-initial;
        @apply font-mono;
        @apply text-6xl;
        
    }

    .button-wrap {
        @apply flex justify-center;
        @apply border-2 border-green-200;
    }

    button {
        @apply mt-12;
        @apply px-4 py-4;
        @apply text-xl uppercase font-black;
        @apply border-2 border-black;
        @apply filter drop-shadow;
        @apply cursor-pointer;
        // filter: drop-shadow(8px 8px 0px #6EE7B7);
        @apply animate-spin;

    }

    @keyframes rainbow {
        0% {
            filter: hue-rotate(0deg);
        }
        100% {
            filter: hue-rotate(360deg);
        }
    }
</style>
