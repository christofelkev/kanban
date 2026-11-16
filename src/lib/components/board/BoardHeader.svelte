<script lang="ts">
  import type { KanbanBoard, LabelRow } from '../../types/kanban.types';
  import { t } from '../../i18n/index.svelte';
  import LanguageSwitcher from '../ui/LanguageSwitcher.svelte';
  import {
    ArrowLeft,
    Plus,
    Columns3,
    CheckSquare,
    Settings,
    Search,
    X,
    Filter
  } from '@lucide/svelte';

  interface Props {
    board: KanbanBoard;
    availableLabels: LabelRow[];
    selectedLabelId: string | null;
    searchQuery: string;
    onSelectLabel: (labelId: string | null) => void;
    onSearchChange: (query: string) => void;
    onAddColumn: () => void;
    onEditBoard?: () => void;
  }

  let {
    board,
    availableLabels,
    selectedLabelId,
    searchQuery,
    onSelectLabel,
    onSearchChange,
    onAddColumn,
    onEditBoard
  }: Props = $props();

  const totalCards = $derived(
    board.columns.reduce((acc, col) => acc + col.items.length, 0)
  );
</script>

<div class="border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
  <!-- Top Bar: Nav, Title, Stats & Actions -->
  <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
    <!-- Left: Back Button & Title -->
    <div class="flex items-center gap-3">
      <a
        href="/"
        title={t('backToBoards')}
        class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <ArrowLeft class="h-4 w-4" />
      </a>

      <div class="flex items-center gap-2.5">
        <div
          class="h-3.5 w-3.5 rounded-full ring-2 ring-slate-100"
          style="background-color: {board.color || '#6366F1'}"
        ></div>
        <h1 class="text-lg font-bold tracking-tight text-slate-900 sm:text-xl line-clamp-1">
          {board.title}
        </h1>
      </div>

      {#if onEditBoard}
        <button
          type="button"
          onclick={onEditBoard}
          title={t('boardSettings')}
          class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <Settings class="h-3.5 w-3.5" />
        </button>
      {/if}
    </div>

    <!-- Right: Search, Language, Stats & Actions -->
    <div class="flex items-center gap-2.5 sm:gap-3">
      <!-- Search Input -->
      <div class="relative flex items-center">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
          <Search class="h-3.5 w-3.5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          oninput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
          placeholder={t('searchCardsPlaceholder')}
          class="min-h-[36px] w-32 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-8 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:w-48 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 sm:w-44 sm:focus:w-56 transition-all"
        />
        {#if searchQuery}
          <button
            type="button"
            onclick={() => onSearchChange('')}
            class="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-600"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        {/if}
      </div>

      <!-- Quick Stats -->
      <div class="hidden items-center gap-3 text-xs font-medium text-slate-500 md:flex">
        <span class="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1">
          <Columns3 class="h-3.5 w-3.5 text-slate-400" />
          {board.columns.length} {t('columns')}
        </span>
        <span class="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1">
          <CheckSquare class="h-3.5 w-3.5 text-slate-400" />
          {totalCards} {t('tasks')}
        </span>
      </div>

      <LanguageSwitcher />

      <!-- Add Column Button -->
      <button
        type="button"
        onclick={onAddColumn}
        class="flex min-h-[36px] items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 active:bg-indigo-800 sm:text-sm"
      >
        <Plus class="h-4 w-4" />
        <span>{t('addColumn')}</span>
      </button>
    </div>
  </div>

  <!-- Bottom Bar: Label Filters (if labels exist) -->
  {#if availableLabels.length > 0}
    <div class="border-t border-slate-100 bg-slate-50/70 px-4 py-2 sm:px-6 lg:px-8">
      <div class="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto text-xs scrollbar-none">
        <div class="flex items-center gap-1 text-slate-400 shrink-0 font-medium mr-1">
          <Filter class="h-3 w-3" />
          <span>{t('filterLabel')}</span>
        </div>

        <button
          type="button"
          onclick={() => onSelectLabel(null)}
          class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition {selectedLabelId === null
            ? 'bg-slate-900 text-white'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}"
        >
          {t('allLabels')}
        </button>

        {#each availableLabels as label (label.id)}
          {@const isSelected = selectedLabelId === label.id}
          <button
            type="button"
            onclick={() => onSelectLabel(isSelected ? null : label.id)}
            class="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition {isSelected
              ? 'ring-2 ring-slate-900 shadow-xs'
              : 'border border-slate-200 hover:border-slate-300'}"
            style="background-color: {isSelected ? label.color : '#FFFFFF'}; color: {isSelected ? '#FFFFFF' : '#334155'}"
          >
            <span
              class="h-2 w-2 rounded-full"
              style="background-color: {isSelected ? '#FFFFFF' : label.color}"
            ></span>
            <span>{label.name}</span>
          </button>
        {/each}

        {#if selectedLabelId !== null || searchQuery}
          <button
            type="button"
            onclick={() => { onSelectLabel(null); onSearchChange(''); }}
            class="shrink-0 text-xs font-medium text-indigo-600 hover:underline pl-2"
          >
            {t('resetFilter')}
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>
