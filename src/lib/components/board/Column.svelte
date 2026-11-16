<script lang="ts">
  import type { KanbanColumn, KanbanCard } from '../../types/kanban.types';
  import { t } from '../../i18n/index.svelte';
  import CardItem from './CardItem.svelte';
  import { dndzone } from 'svelte-dnd-action';
  import { Plus, MoreHorizontal, Edit2, Trash2, X, Loader2 } from '@lucide/svelte';

  interface Props {
    column: KanbanColumn;
    onRenameColumn: (columnId: string, newTitle: string) => Promise<void>;
    onDeleteColumn: (columnId: string) => Promise<void>;
    onAddCard: (columnId: string, title: string) => Promise<void>;
    onCardClick: (card: KanbanCard) => void;
    onColumnCardsChange: (columnId: string, items: KanbanCard[]) => void;
  }

  let {
    column,
    onRenameColumn,
    onDeleteColumn,
    onAddCard,
    onCardClick,
    onColumnCardsChange
  }: Props = $props();

  // Rename State
  let isEditingTitle = $state(false);
  let editTitleText = $state('');
  let isMenuOpen = $state(false);

  // Add Card State
  let isAddingCard = $state(false);
  let newCardTitle = $state('');
  let isSubmittingCard = $state(false);

  function startRename() {
    editTitleText = column.title;
    isEditingTitle = true;
    isMenuOpen = false;
  }

  async function saveRename() {
    if (!editTitleText.trim() || editTitleText.trim() === column.title) {
      isEditingTitle = false;
      return;
    }
    await onRenameColumn(column.id, editTitleText.trim());
    isEditingTitle = false;
  }

  function handleTitleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      saveRename();
    } else if (e.key === 'Escape') {
      isEditingTitle = false;
    }
  }

  async function handleAddCardSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!newCardTitle.trim() || isSubmittingCard) return;

    isSubmittingCard = true;
    try {
      await onAddCard(column.id, newCardTitle.trim());
      newCardTitle = '';
      isAddingCard = false;
    } finally {
      isSubmittingCard = false;
    }
  }

  function handleDndConsider(e: CustomEvent<{ items: KanbanCard[] }>) {
    onColumnCardsChange(column.id, e.detail.items);
  }

  function handleDndFinalize(e: CustomEvent<{ items: KanbanCard[] }>) {
    onColumnCardsChange(column.id, e.detail.items);
  }

  function toggleMenu(e: MouseEvent) {
    e.stopPropagation();
    isMenuOpen = !isMenuOpen;
  }

  function handleWindowClick() {
    if (isMenuOpen) isMenuOpen = false;
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="flex w-[82vw] max-w-[310px] shrink-0 flex-col rounded-2xl border border-slate-200/90 bg-slate-100/80 shadow-xs sm:w-80">
  <!-- Column Header -->
  <div class="flex items-center justify-between px-3.5 py-3 border-b border-slate-200/60">
    <div class="flex flex-1 items-center gap-2">
      {#if isEditingTitle}
        <input
          type="text"
          bind:value={editTitleText}
          onblur={saveRename}
          onkeydown={handleTitleKeydown}
          class="w-full rounded-md border border-indigo-500 bg-white px-2 py-1 text-sm font-semibold text-slate-800 focus:outline-none"
        />
      {:else}
        <button
          type="button"
          onclick={startRename}
          class="text-left font-semibold text-sm text-slate-800 hover:text-indigo-600 truncate transition"
        >
          {column.title}
        </button>
      {/if}

      <span class="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-200/80 px-1.5 text-[11px] font-bold text-slate-600">
        {column.items.length}
      </span>
    </div>

    <!-- Options Menu -->
    <div class="relative">
      <button
        type="button"
        onclick={toggleMenu}
        aria-label="Menu opsi kolom"
        class="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 focus:outline-none"
      >
        <MoreHorizontal class="h-4 w-4" />
      </button>

      {#if isMenuOpen}
        <div class="absolute right-0 top-8 z-20 w-32 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onclick={startRename}
            class="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 text-left"
          >
            <Edit2 class="h-3 w-3 text-slate-400" />
            <span>{t('renameColumn')}</span>
          </button>
          <button
            type="button"
            onclick={() => { isMenuOpen = false; onDeleteColumn(column.id); }}
            class="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 text-left"
          >
            <Trash2 class="h-3 w-3 text-red-500" />
            <span>{t('deleteColumn')}</span>
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Cards Container (Drag & Drop Zone) -->
  <div
    use:dndzone={{
      items: column.items,
      flipDurationMs: 200,
      dropTargetStyle: {
        outline: '2px dashed #6366F1',
        borderRadius: '0.75rem',
        backgroundColor: '#EEF2FF'
      }
    }}
    onconsider={handleDndConsider}
    onfinalize={handleDndFinalize}
    class="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3 min-h-[150px] max-h-[calc(100vh-250px)]"
  >
    {#each column.items as card (card.id)}
      <CardItem {card} onClick={() => onCardClick(card)} />
    {/each}
  </div>

  <!-- Column Footer (Add Card Form / Button) -->
  <div class="p-2.5 pt-0">
    {#if isAddingCard}
      <form onsubmit={handleAddCardSubmit} class="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
        <textarea
          required
          rows="2"
          bind:value={newCardTitle}
          placeholder={t('newCardPlaceholder')}
          class="block w-full resize-none rounded-md border border-slate-300 p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
        ></textarea>
        <div class="mt-2 flex items-center justify-between">
          <button
            type="submit"
            disabled={isSubmittingCard}
            class="flex min-h-[32px] items-center gap-1 rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {#if isSubmittingCard}
              <Loader2 class="h-3 w-3 animate-spin" />
            {/if}
            <span>{t('add')}</span>
          </button>
          <button
            type="button"
            onclick={() => { isAddingCard = false; newCardTitle = ''; }}
            class="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </form>
    {:else}
      <button
        type="button"
        onclick={() => (isAddingCard = true)}
        class="flex w-full min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition"
      >
        <Plus class="h-3.5 w-3.5" />
        <span>{t('addCard')}</span>
      </button>
    {/if}
  </div>
</div>
