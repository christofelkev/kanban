<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '../../../lib/supabase/auth.svelte';
  import { Loader2 } from '@lucide/svelte';

  onMount(async () => {
    await auth.init();
    goto('/', { replaceState: true });
  });
</script>

<div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
  <div class="flex flex-col items-center gap-3 text-slate-600">
    <Loader2 class="h-8 w-8 animate-spin text-indigo-600" />
    <p class="text-sm font-medium">Memverifikasi autentikasi...</p>
  </div>
</div>
