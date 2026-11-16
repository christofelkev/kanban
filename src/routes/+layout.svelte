<script lang="ts">
  import './layout.css';
  import favicon from '#lib/assets/favicon.svg';
  import type { LayoutProps } from './$types';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { auth } from '../lib/supabase/auth.svelte';
  import { Loader2 } from '@lucide/svelte';

  let { children }: LayoutProps = $props();

  onMount(() => {
    auth.init();
  });

  $effect(() => {
    if (auth.loading) return;

    const pathname = page.url.pathname;
    const isAuthRoute = pathname.startsWith('/auth');

    if (!auth.user && !isAuthRoute) {
      goto('/auth', { replaceState: true });
    } else if (auth.user && isAuthRoute && pathname !== '/auth/callback') {
      goto('/', { replaceState: true });
    }
  });
</script>

<svelte:head>
  <title>KanbanKu</title>
  <link rel="icon" href={favicon} />
</svelte:head>

{#if auth.loading}
  <div class="flex min-h-screen items-center justify-center bg-slate-50">
    <div class="flex flex-col items-center gap-3 text-slate-500">
      <Loader2 class="h-8 w-8 animate-spin text-indigo-600" />
      <span class="text-xs font-medium tracking-wide uppercase">Memuat KanbanKu...</span>
    </div>
  </div>
{:else}
  {@render children()}
{/if}
