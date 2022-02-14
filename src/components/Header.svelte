<script lang="ts">
    import Logo from './Logo.svelte'
</script>

<header>
    <div class="header-content">
        <div class="left">
            <div class="logo-wrap">
                <Logo hexColor="#ffffff" />
            </div>
        </div>
    </div>
</header>

<style>
    header {
        @apply fixed inset-0;
        @apply bg-transparent;
        @apply h-14 w-full;
    }

    .header-content {
        @apply flex justify-between;
        @apply p-2;
        @apply font-mono uppercase;
    }

    .left {
        @apply flex;
    }

    .logo-wrap {
        @apply h-11;
    }

    /* .title {
        @apply text-lg text-white mt-2 pl-2;
    } */
</style>
