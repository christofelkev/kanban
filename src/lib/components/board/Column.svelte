<script lang="ts">
  import type { KanbanColumn, KanbanCard } from '../../types/kanban.types';
  import { t } from '../../i18n/index.svelte';
  import CardItem from './CardItem.svelte';
  import { dndzone } from 'svelte-dnd-action';
  import {
    Plus,
    MoreHorizontal,
    Edit2,
    Trash2,
    X,
    Loader2,
    GripVertical,
    ChevronsLeft,
    ChevronsRight,
    AlertTriangle,
    Calendar,
    ArrowDownAZ,
    Clock,
    SlidersHorizontal,
    Palette,
    Check
  } from '@lucide/svelte';

  interface Props {
    column: KanbanColumn;
    onRenameColumn: (columnId: string, newTitle: string) => Promise<void>;
    onDeleteColumn: (columnId: string) => Promise<void>;
    onAddCard: (columnId: string, title: string) => Promise<void>;
    onCardClick: (card: KanbanCard) => void;
    onColumnCardsChange: (columnId: string, items: KanbanCard[]) => void;
    onUpdateColumn?: (
      columnId: string,
      updates: { wip_limit?: number | null; color?: string | null; is_collapsed?: boolean }
    ) => Promise<void>;
    onSortCards?: (
      columnId: string,
      criterion: 'dueDate' | 'title' | 'newest' | 'oldest'
    ) => void;
  }

  let {
    column,
    onRenameColumn,
    onDeleteColumn,
    onAddCard,
    onCardClick,
    onColumnCardsChange,
    onUpdateColumn,
    onSortCards
  }: Props = $props();

  // Rename State
  let isEditingTitle = $state(false);
  let editTitleText = $state('');
  let isMenuOpen = $state(false);

  // Add Card State
  let isAddingCard = $state(false);
  let newCardTitle = $state('');
  let isSubmittingCard = $state(false);

  // WIP Limit Input Mode
  let isEditingWip = $state(false);
  let wipInputValue = $state('');

  // Submenu states
  let isSortSubmenuOpen = $state(false);
  let isColorSubmenuOpen = $state(false);

  const columnColors = [
    { label: 'Default', value: null },
    { label: 'Blue', value: '#3B82F6' },
    { label: 'Emerald', value: '#10B981' },
    { label: 'Amber', value: '#F59E0B' },
    { label: 'Rose', value: '#F43F5E' },
    { label: 'Purple', value: '#A855F7' }
  ];

  const isWipExceeded = $derived(
    Boolean(column.wip_limit && column.wip_limit > 0 && column.items.length > column.wip_limit)
  );

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
    isEditingWip = false;
    isSortSubmenuOpen = false;
    isColorSubmenuOpen = false;
  }

  function handleWindowClick() {
    if (isMenuOpen) {
      isMenuOpen = false;
      isEditingWip = false;
      isSortSubmenuOpen = false;
      isColorSubmenuOpen = false;
    }
  }

  async function toggleCollapse() {
    if (!onUpdateColumn) return;
    const nextCollapsed = !column.is_collapsed;
    await onUpdateColumn(column.id, { is_collapsed: nextCollapsed });
  }

  async function handleSaveWip() {
    if (!onUpdateColumn) return;
    const num = parseInt(wipInputValue.trim(), 10);
    const limit = isNaN(num) || num <= 0 ? null : num;
    await onUpdateColumn(column.id, { wip_limit: limit });
    isEditingWip = false;
    isMenuOpen = false;
  }

  async function handleSelectColor(color: string | null) {
    if (!onUpdateColumn) return;
    await onUpdateColumn(column.id, { color });
    isColorSubmenuOpen = false;
    isMenuOpen = false;
  }

  function handleSort(criterion: 'dueDate' | 'title' | 'newest' | 'oldest') {
    if (onSortCards) {
      onSortCards(column.id, criterion);
    }
    isSortSubmenuOpen = false;
    isMenuOpen = false;
  }
</script>

<svelte:window onclick={handleWindowClick} />

{#if column.is_collapsed}
  <!-- Collapsed Column Strip -->
  <div
    role="button"
    tabindex="0"
    onclick={toggleCollapse}
    onkeydown={(e) => e.key === 'Enter' && toggleCollapse()}
    class="flex w-12 sm:w-14 shrink-0 flex-col items-center justify-between rounded-2xl border {isWipExceeded
      ? 'border-red-300 bg-red-50/60'
      : 'border-slate-200/90 bg-slate-100/90'} shadow-xs hover:border-indigo-400 hover:bg-slate-200/50 cursor-pointer transition select-none py-3.5 min-h-[420px] overflow-hidden relative group"
    title="{column.title} - {t('expandColumn')}"
  >
    {#if column.color}
      <div class="absolute top-0 inset-x-0 h-1.5" style="background-color: {column.color}"></div>
    {/if}

    <div class="flex flex-col items-center gap-2">
      <button
        type="button"
        onclick={(e) => { e.stopPropagation(); toggleCollapse(); }}
        title={t('expandColumn')}
        class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600 transition shadow-2xs"
      >
        <ChevronsRight class="h-4 w-4" />
      </button>

      <span
        class="flex h-6 min-w-[24px] items-center justify-center rounded-full {isWipExceeded
          ? 'bg-red-100 text-red-700 font-bold border border-red-200'
          : 'bg-slate-200 text-slate-700 font-bold'} px-1.5 text-xs"
      >
        {#if column.wip_limit}
          {column.items.length}/{column.wip_limit}
        {:else}
          {column.items.length}
        {/if}
      </span>
    </div>

    <!-- Vertical Title -->
    <div class="my-auto py-4 flex items-center justify-center">
      <span
        class="text-xs font-bold text-slate-700 tracking-wide uppercase truncate max-w-[240px] whitespace-nowrap"
        style="writing-mode: vertical-rl; transform: rotate(180deg);"
      >
        {column.title}
      </span>
    </div>

    {#if isWipExceeded}
      <div class="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 mb-1" title={t('wipLimitExceeded')}>
        <AlertTriangle class="h-3.5 w-3.5" />
      </div>
    {/if}
  </div>
{:else}
  <!-- Expanded Column -->
  <div
    class="flex w-[82vw] max-w-[310px] shrink-0 flex-col rounded-2xl border {isWipExceeded
      ? 'border-red-300 bg-red-50/30'
      : 'border-slate-200/90 bg-slate-100/80'} shadow-xs sm:w-80 relative overflow-hidden transition-all duration-200"
  >
    <!-- Top Accent Color Bar -->
    {#if column.color}
      <div class="h-1.5 w-full shrink-0" style="background-color: {column.color}"></div>
    {/if}

    <!-- Column Header -->
    <div class="flex items-center justify-between px-3.5 py-3 border-b border-slate-200/60 cursor-grab active:cursor-grabbing">
      <div class="flex flex-1 items-center gap-2 min-w-0">
        <div class="flex items-center text-slate-400 hover:text-slate-600 transition" title="Drag to reorder column">
          <GripVertical class="h-4 w-4 shrink-0" />
        </div>
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

        <!-- Card Count / WIP Counter -->
        <span
          class="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold shrink-0 transition {isWipExceeded
            ? 'bg-red-100 text-red-700 border border-red-200'
            : column.wip_limit
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
              : 'bg-slate-200/80 text-slate-600'}"
          title={isWipExceeded ? t('wipLimitExceeded') : column.wip_limit ? `${t('wipLimit')}: ${column.wip_limit}` : undefined}
        >
          {#if column.wip_limit}
            {column.items.length}/{column.wip_limit}
          {:else}
            {column.items.length}
          {/if}
        </span>
      </div>

      <!-- Header Action Buttons -->
      <div class="flex items-center gap-1">
        <!-- Collapse Button -->
        <button
          type="button"
          onclick={toggleCollapse}
          title={t('collapseColumn')}
          class="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 focus:outline-none"
        >
          <ChevronsLeft class="h-4 w-4" />
        </button>

        <!-- Options Menu Button -->
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
            <div
              role="presentation"
              onclick={(e) => e.stopPropagation()}
              class="absolute right-0 top-8 z-30 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl text-xs"
            >
              <!-- Rename -->
              <button
                type="button"
                onclick={startRename}
                class="flex w-full items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 text-left"
              >
                <Edit2 class="h-3.5 w-3.5 text-slate-400" />
                <span>{t('renameColumn')}</span>
              </button>

              <!-- WIP Limit -->
              <div>
                {#if isEditingWip}
                  <div class="px-3 py-2 border-y border-slate-100 bg-slate-50">
                    <label for="wip-input-{column.id}" class="block text-[11px] font-semibold text-slate-600 mb-1">
                      {t('wipLimit')} ({t('noLimit')}: 0)
                    </label>
                    <div class="flex items-center gap-1.5">
                      <input
                        id="wip-input-{column.id}"
                        type="number"
                        min="0"
                        max="99"
                        bind:value={wipInputValue}
                        placeholder="0"
                        class="w-16 rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onclick={handleSaveWip}
                        class="rounded bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700"
                      >
                        {t('saveDescription')}
                      </button>
                    </div>
                  </div>
                {:else}
                  <button
                    type="button"
                    onclick={() => { isEditingWip = true; wipInputValue = column.wip_limit?.toString() ?? ''; isSortSubmenuOpen = false; isColorSubmenuOpen = false; }}
                    class="flex w-full items-center justify-between px-3 py-2 text-slate-700 hover:bg-slate-50 text-left"
                  >
                    <div class="flex items-center gap-2.5">
                      <SlidersHorizontal class="h-3.5 w-3.5 text-slate-400" />
                      <span>{t('wipLimit')}</span>
                    </div>
                    {#if column.wip_limit}
                      <span class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                        {column.wip_limit}
                      </span>
                    {/if}
                  </button>
                {/if}
              </div>

              <!-- Sort Submenu -->
              <div>
                <button
                  type="button"
                  onclick={() => { isSortSubmenuOpen = !isSortSubmenuOpen; isColorSubmenuOpen = false; isEditingWip = false; }}
                  class="flex w-full items-center justify-between px-3 py-2 text-slate-700 hover:bg-slate-50 text-left"
                >
                  <div class="flex items-center gap-2.5">
                    <ArrowDownAZ class="h-3.5 w-3.5 text-slate-400" />
                    <span>{t('sortCards')}</span>
                  </div>
                  <span class="text-slate-400 text-[10px]">&rsaquo;</span>
                </button>

                {#if isSortSubmenuOpen}
                  <div class="border-y border-slate-100 bg-slate-50/80 py-1 pl-4">
                    <button
                      type="button"
                      onclick={() => handleSort('dueDate')}
                      class="flex w-full items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-indigo-600 text-left text-[11px]"
                    >
                      <Calendar class="h-3 w-3" />
                      <span>{t('sortByDueDate')}</span>
                    </button>
                    <button
                      type="button"
                      onclick={() => handleSort('title')}
                      class="flex w-full items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-indigo-600 text-left text-[11px]"
                    >
                      <ArrowDownAZ class="h-3 w-3" />
                      <span>{t('sortByTitle')}</span>
                    </button>
                    <button
                      type="button"
                      onclick={() => handleSort('newest')}
                      class="flex w-full items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-indigo-600 text-left text-[11px]"
                    >
                      <Clock class="h-3 w-3" />
                      <span>{t('sortByNewest')}</span>
                    </button>
                    <button
                      type="button"
                      onclick={() => handleSort('oldest')}
                      class="flex w-full items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-indigo-600 text-left text-[11px]"
                    >
                      <Clock class="h-3 w-3" />
                      <span>{t('sortByOldest')}</span>
                    </button>
                  </div>
                {/if}
              </div>

              <!-- Color Palette -->
              <div>
                <button
                  type="button"
                  onclick={() => { isColorSubmenuOpen = !isColorSubmenuOpen; isSortSubmenuOpen = false; isEditingWip = false; }}
                  class="flex w-full items-center justify-between px-3 py-2 text-slate-700 hover:bg-slate-50 text-left"
                >
                  <div class="flex items-center gap-2.5">
                    <Palette class="h-3.5 w-3.5 text-slate-400" />
                    <span>{t('columnColor')}</span>
                  </div>
                  {#if column.color}
                    <span class="h-2.5 w-2.5 rounded-full" style="background-color: {column.color}"></span>
                  {/if}
                </button>

                {#if isColorSubmenuOpen}
                  <div class="flex flex-wrap gap-2 px-4 py-2 border-y border-slate-100 bg-slate-50">
                    {#each columnColors as c}
                      <button
                        type="button"
                        onclick={() => handleSelectColor(c.value)}
                        title={c.label}
                        class="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 transition hover:scale-110"
                        style="background-color: {c.value || '#E2E8F0'}"
                      >
                        {#if column.color === c.value || (!column.color && !c.value)}
                          <Check class="h-3 w-3 stroke-[3] {c.value ? 'text-white' : 'text-slate-600'}" />
                        {/if}
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>

              <!-- Collapse -->
              <button
                type="button"
                onclick={toggleCollapse}
                class="flex w-full items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 text-left"
              >
                <ChevronsLeft class="h-3.5 w-3.5 text-slate-400" />
                <span>{t('collapseColumn')}</span>
              </button>

              <div class="my-1 border-t border-slate-100"></div>

              <!-- Delete -->
              <button
                type="button"
                onclick={() => { isMenuOpen = false; onDeleteColumn(column.id); }}
                class="flex w-full items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50 text-left"
              >
                <Trash2 class="h-3.5 w-3.5 text-red-500" />
                <span>{t('deleteColumn')}</span>
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- WIP Limit Exceeded Alert Banner -->
    {#if isWipExceeded}
      <div class="mx-3 mt-2 flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
        <AlertTriangle class="h-3.5 w-3.5 shrink-0" />
        <span>{t('wipLimitExceeded')} ({column.items.length}/{column.wip_limit})</span>
      </div>
    {/if}

    <!-- Cards Container (Drag & Drop Zone) -->
    <div
      use:dndzone={{
        items: column.items,
        type: 'card',
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
{/if}
