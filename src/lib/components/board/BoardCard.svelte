<script lang="ts">
  import type { BoardWithStats } from '../../services/board.service';
  import { t } from '../../i18n/index.svelte';
  import { MoreVertical, Edit2, Trash2, Columns3, CheckSquare } from '@lucide/svelte';

  interface Props {
    board: BoardWithStats;
    onEdit: (board: BoardWithStats) => void;
    onDelete: (board: BoardWithStats) => void;
  }

  let { board, onEdit, onDelete }: Props = $props();

  let isMenuOpen = $state(false);

  const columnCount = $derived(board.lists?.length ?? 0);
  const cardCount = $derived(
    board.lists?.reduce((sum, list) => sum + (list.cards?.length ?? 0), 0) ?? 0
  );

  function toggleMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    isMenuOpen = !isMenuOpen;
  }

  function handleEdit(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    isMenuOpen = false;
    onEdit(board);
  }

  function handleDelete(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    isMenuOpen = false;
    onDelete(board);
  }

  function handleWindowClick() {
    if (isMenuOpen) {
      isMenuOpen = false;
    }
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs transition hover:border-slate-300 hover:shadow-md">
  <!-- Accent Top Bar -->
  <div class="h-2.5 w-full" style="background-color: {board.color || '#6366F1'}"></div>

  <div class="flex flex-1 flex-col p-5">
    <div class="flex items-start justify-between gap-2">
      <a href="/board/{board.id}" class="flex-1 font-semibold text-slate-900 group-hover:text-indigo-600 transition">
        <h3 class="text-base sm:text-lg line-clamp-1">{board.title}</h3>
      </a>

      <!-- Options Button -->
      <div class="relative">
        <button
          type="button"
          onclick={toggleMenu}
          aria-label="Menu opsi board"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <MoreVertical class="h-4 w-4" />
        </button>

        {#if isMenuOpen}
          <div class="absolute right-0 top-9 z-20 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onclick={handleEdit}
              class="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 text-left"
            >
              <Edit2 class="h-3.5 w-3.5 text-slate-400" />
              <span>{t('editBoard')}</span>
            </button>
            <button
              type="button"
              onclick={handleDelete}
              class="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 text-left"
            >
              <Trash2 class="h-3.5 w-3.5 text-red-500" />
              <span>{t('deleteBoard')}</span>
            </button>
          </div>
        {/if}
      </div>
    </div>

    <!-- Quick Stats -->
    <a href="/board/{board.id}" class="mt-4 flex items-center gap-4 text-xs font-medium text-slate-500">
      <span class="flex items-center gap-1.5">
        <Columns3 class="h-3.5 w-3.5 text-slate-400" />
        {columnCount} {t('columns')}
      </span>
      <span class="flex items-center gap-1.5">
        <CheckSquare class="h-3.5 w-3.5 text-slate-400" />
        {cardCount} {t('tasks')}
      </span>
    </a>
  </div>

  <a
    href="/board/{board.id}"
    class="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs font-medium text-indigo-600 hover:bg-indigo-50/50 transition"
  >
    <span>{t('openBoard')}</span>
    <span class="font-bold tracking-tight">&rarr;</span>
  </a>
</div>
