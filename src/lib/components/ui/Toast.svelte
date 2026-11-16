<script lang="ts">
  import { toast } from '../../stores/toast.svelte';
  import { CheckCircle2, AlertCircle, Info, X } from '@lucide/svelte';
</script>

{#if toast.items.length > 0}
  <div
    class="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
    aria-live="polite"
    aria-atomic="true"
  >
    {#each toast.items as item (item.id)}
      <div
        class="pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 {item.type ===
        'error'
          ? 'border-red-200 bg-red-50/95 text-red-900 shadow-red-500/5'
          : item.type === 'success'
            ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900 shadow-emerald-500/5'
            : 'border-slate-200 bg-white/95 text-slate-800 shadow-slate-900/5'}"
      >
        <div class="mt-0.5 shrink-0">
          {#if item.type === 'error'}
            <AlertCircle class="h-4 w-4 text-red-600" />
          {:else if item.type === 'success'}
            <CheckCircle2 class="h-4 w-4 text-emerald-600" />
          {:else}
            <Info class="h-4 w-4 text-indigo-600" />
          {/if}
        </div>

        <p class="flex-1 text-xs font-medium leading-relaxed">
          {item.message}
        </p>

        <button
          type="button"
          onclick={() => toast.dismiss(item.id)}
          class="shrink-0 rounded-md p-0.5 text-slate-400 hover:text-slate-700 transition"
          aria-label="Dismiss notification"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>
    {/each}
  </div>
{/if}

