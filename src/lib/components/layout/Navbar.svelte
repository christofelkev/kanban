<script lang="ts">
  import { auth } from '../../supabase/auth.svelte';
  import Logo from '../ui/Logo.svelte';
  import { Plus, LogOut, User } from '@lucide/svelte';

  interface Props {
    onOpenNewBoard?: () => void;
  }

  let { onOpenNewBoard }: Props = $props();
  let isLoggingOut = $state(false);

  async function handleSignOut() {
    if (isLoggingOut) return;
    isLoggingOut = true;
    try {
      await auth.signOut();
    } finally {
      isLoggingOut = false;
    }
  }
</script>

<header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
  <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
    <a href="/" class="flex items-center gap-2.5 font-bold text-slate-900 transition hover:opacity-90">
      <Logo size={36} class="rounded-xl shadow-xs" />
      <div class="flex flex-col">
        <span class="text-base font-bold tracking-tight text-slate-900 sm:text-lg">KanbanKu</span>
      </div>
    </a>

    <div class="flex items-center gap-2 sm:gap-3">
      {#if onOpenNewBoard}
        <button
          type="button"
          onclick={onOpenNewBoard}
          class="flex min-h-[40px] items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-indigo-800 sm:text-sm"
        >
          <Plus class="h-4 w-4" />
          <span>Board Baru</span>
        </button>
      {/if}

      {#if auth.user}
        <div class="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3">
          <div class="hidden items-center gap-2 rounded-full bg-slate-100 py-1 pl-1.5 pr-3 text-xs text-slate-700 sm:flex">
            <div class="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold uppercase text-[10px]">
              {auth.user.email?.[0] ?? 'U'}
            </div>
            <span class="max-w-[150px] truncate font-medium">{auth.user.email}</span>
          </div>

          <button
            type="button"
            onclick={handleSignOut}
            disabled={isLoggingOut}
            title="Keluar dari akun"
            class="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <LogOut class="h-4 w-4" />
          </button>
        </div>
      {/if}
    </div>
  </div>
</header>
