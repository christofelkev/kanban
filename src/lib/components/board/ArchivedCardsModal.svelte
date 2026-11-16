<script lang="ts">
  import type { KanbanCard } from '../../types/kanban.types';
  import { fetchArchivedCards } from '../../services/card.service';
  import { t } from '../../i18n/index.svelte';
  import { Archive, RotateCcw, Trash2, X, Loader2 } from '@lucide/svelte';

  interface Props {
    isOpen: boolean;
    boardId: string;
    onClose: () => void;
    onRestoreCard: (cardId: string) => Promise<void>;
    onDeletePermanent: (cardId: string) => Promise<void>;
  }

  let { isOpen, boardId, onClose, onRestoreCard, onDeletePermanent }: Props = $props();

  let archivedCards = $state<KanbanCard[]>([]);
  let isLoading = $state(true);
  let actionInProgress = $state<string | null>(null);

  $effect(() => {
    if (isOpen && boardId) {
      loadArchived();
    }
  });

  async function loadArchived() {
    isLoading = true;
    try {
      const res = await fetchArchivedCards(boardId);
      archivedCards = res.data ?? [];
    } finally {
      isLoading = false;
    }
  }

  async function handleRestore(card: KanbanCard) {
    actionInProgress = card.id;
    try {
      await onRestoreCard(card.id);
      archivedCards = archivedCards.filter((c) => c.id !== card.id);
    } finally {
      actionInProgress = null;
    }
  }

  async function handleDelete(card: KanbanCard) {
    const confirmed = confirm(t('deletePermanentConfirm'));
    if (!confirmed) return;

    actionInProgress = card.id;
    try {
      await onDeletePermanent(card.id);
      archivedCards = archivedCards.filter((c) => c.id !== card.id);
    } finally {
      actionInProgress = null;
    }
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div
      role="presentation"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
      onclick={onClose}
    ></div>

    <!-- Modal Dialog -->
    <div
      role="dialog"
      aria-modal="true"
      class="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl flex flex-col max-h-[85vh]"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div class="flex items-center gap-2.5">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Archive class="h-4 w-4" />
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-900">{t('archivedCards')}</h2>
            <p class="text-xs text-slate-500">Board Recycle Bin</p>
          </div>
        </div>

        <button
          type="button"
          onclick={onClose}
          class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Card List -->
      <div class="flex-1 overflow-y-auto py-4 space-y-2.5 min-h-[200px]">
        {#if isLoading}
          <div class="flex h-40 items-center justify-center">
            <Loader2 class="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        {:else if archivedCards.length === 0}
          <div class="flex h-40 flex-col items-center justify-center text-center text-slate-400">
            <Archive class="h-8 w-8 mb-2 opacity-50" />
            <p class="text-xs">{t('noArchivedCards')}</p>
          </div>
        {:else}
          {#each archivedCards as card (card.id)}
            <div class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 hover:bg-white transition">
              <div class="flex-1 min-w-0">
                <h4 class="text-xs font-semibold text-slate-800 truncate">{card.title}</h4>
                {#if card.labels && card.labels.length > 0}
                  <div class="mt-1 flex flex-wrap gap-1">
                    {#each card.labels as label}
                      <span
                        class="rounded-full px-1.5 py-0.2 text-[9px] font-semibold text-white"
                        style="background-color: {label.color}"
                      >
                        {label.name}
                      </span>
                    {/each}
                  </div>
                {/if}
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={actionInProgress === card.id}
                  onclick={() => handleRestore(card)}
                  title={t('restore')}
                  class="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 shadow-2xs transition"
                >
                  <RotateCcw class="h-3.5 w-3.5 text-indigo-600" />
                  <span>{t('restore')}</span>
                </button>
                <button
                  type="button"
                  disabled={actionInProgress === card.id}
                  onclick={() => handleDelete(card)}
                  title={t('deletePermanently')}
                  class="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 shadow-2xs transition"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <!-- Footer -->
      <div class="pt-3 border-t border-slate-100 flex justify-end">
        <button
          type="button"
          onclick={onClose}
          class="rounded-lg border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {t('close')}
        </button>
      </div>
    </div>
  </div>
{/if}

