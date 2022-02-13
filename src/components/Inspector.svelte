<script lang="ts">
    export let name: string
    export let object: unknown

    let open: boolean = false

    const toggle = (event) => {
        open = !open
        console.debug("event", event)
    }
</script>

<div class="inspector">
    <div class=header on:click="{toggle}"> 
        <div class="title" >
            {name} 
        </div>
        <div class="indicator">
            {#if open}
            ↓
            {:else}
            ↑
            {/if}
        </div>
    </div>
    <div class="content {open ? 'open' : 'closed'}">
        <pre>{ JSON.stringify(object, null, 4) }</pre>
    </div> 
</div>

<style type="text/scss">

    .inspector {
        // @apply my-4;
    }

    .header {
        @apply bg-black text-green-300;
        @apply p-2;
        @apply flex justify-between;
        @apply cursor-pointer;
    }

    .title {
        @apply font-mono;
    }

    .content {
        @apply flex;
        @apply flex-1;
        @apply overflow-hidden;
        &.closed {
            @apply h-0;
        }
    }

    pre {
        @apply flex-1;
        @apply text-xs text-green-200;
        @apply bg-gray-800;
        @apply m-0;
        @apply p-4;
    }
</style>
