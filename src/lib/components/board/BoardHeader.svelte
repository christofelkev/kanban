<script lang="ts">
  import type { KanbanBoard } from '../../types/kanban.types';
  import { ArrowLeft, Plus, Columns3, CheckSquare, Settings } from '@lucide/svelte';

  interface Props {
    board: KanbanBoard;
    onAddColumn: () => void;
    onEditBoard?: () => void;
  }

  let { board, onAddColumn, onEditBoard }: Props = $props();

  const totalCards = $derived(
    board.columns.reduce((acc, col) => acc + col.items.length, 0)
  );
</script>

<div class="border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
  <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
    <!-- Left: Back Button & Title -->
    <div class="flex items-center gap-3">
      <a
        href="/"
        title="Kembali ke Dashboard"
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
          title="Pengaturan Board"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <Settings class="h-3.5 w-3.5" />
        </button>
      {/if}
    </div>

    <!-- Right: Stats & Actions -->
    <div class="flex items-center gap-3">
      <!-- Quick Stats -->
      <div class="hidden items-center gap-3 text-xs font-medium text-slate-500 sm:flex">
        <span class="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1">
          <Columns3 class="h-3.5 w-3.5 text-slate-400" />
          {board.columns.length} Kolom
        </span>
        <span class="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1">
          <CheckSquare class="h-3.5 w-3.5 text-slate-400" />
          {totalCards} Tugas
        </span>
      </div>

      <!-- Add Column Button -->
      <button
        type="button"
        onclick={onAddColumn}
        class="flex min-h-[38px] items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 active:bg-indigo-800 sm:text-sm"
      >
        <Plus class="h-4 w-4" />
        <span>Tambah Kolom</span>
      </button>
    </div>
  </div>
</div>
