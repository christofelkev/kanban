<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '../../../lib/supabase/client';
  import { auth } from '../../../lib/supabase/auth.svelte';
  import { Loader2, AlertCircle } from '@lucide/svelte';

  let errorMsg = $state<string | null>(null);

  onMount(async () => {
    try {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const errorParam = url.searchParams.get('error_description') || url.searchParams.get('error');

      if (errorParam) {
        errorMsg = errorParam;
        setTimeout(() => goto('/auth', { replaceState: true }), 3000);
        return;
      }

      // Tukar authorization code dengan session Supabase (PKCE flow)
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          errorMsg = error.message;
          setTimeout(() => goto('/auth', { replaceState: true }), 3000);
          return;
        }
      }

      await auth.init();
      goto('/', { replaceState: true });
    } catch (err: unknown) {
      errorMsg = err instanceof Error ? err.message : 'Gagal memverifikasi login Google.';
      setTimeout(() => goto('/auth', { replaceState: true }), 3000);
    }
  });
</script>

<div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
  <div class="flex flex-col items-center gap-3 text-slate-600 text-center max-w-sm">
    {#if errorMsg}
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 mb-1">
        <AlertCircle class="h-6 w-6" />
      </div>
      <p class="text-sm font-semibold text-slate-800">Gagal Masuk</p>
      <p class="text-xs text-red-600">{errorMsg}</p>
      <p class="text-xs text-slate-400 mt-2">Mengalihkan kembali ke halaman login...</p>
    {:else}
      <Loader2 class="h-8 w-8 animate-spin text-indigo-600" />
      <p class="text-sm font-medium">Memverifikasi autentikasi Google...</p>
    {/if}
  </div>
</div>
