<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { auth } from '../../../lib/supabase/auth.svelte';
  import { t } from '../../../lib/i18n/index.svelte';
  import BoardHeader from '../../../lib/components/board/BoardHeader.svelte';
  import Column from '../../../lib/components/board/Column.svelte';
  import BoardModal from '../../../lib/components/board/BoardModal.svelte';
  import CardDetailModal from '../../../lib/components/card/CardDetailModal.svelte';
  import {
    fetchBoardDetails,
    createList,
    updateList,
    deleteList,
    reorderLists
  } from '../../../lib/services/list.service';
  import {
    createCard,
    updateCardsPositions
  } from '../../../lib/services/card.service';
  import { updateBoard } from '../../../lib/services/board.service';
  import type { KanbanBoard, KanbanColumn, KanbanCard, LabelRow } from '../../../lib/types/kanban.types';
  import { dndzone } from 'svelte-dnd-action';
  import { Plus, Loader2, AlertCircle, X } from '@lucide/svelte';

  const boardId = $derived(page.params.id);

  let board = $state<KanbanBoard | null>(null);
  let isLoading = $state(true);
  let errorMsg = $state<string | null>(null);
  let hasLoaded = $state(false);

  // Filter & Search State
  let selectedLabelId = $state<string | null>(null);
  let searchQuery = $state('');

  // New Column State
  let isAddingColumn = $state(false);
  let newColumnTitle = $state('');
  let isSubmittingColumn = $state(false);

  // Edit Board Modal State
  let isEditBoardModalOpen = $state(false);

  // Selected Card for Detail Modal (Task 7)
  let selectedCard = $state<KanbanCard | null>(null);

  const availableLabels = $derived.by<LabelRow[]>(() => {
    if (!board) return [];
    const map = new Map<string, LabelRow>();
    board.columns.forEach((col) => {
      col.items.forEach((card) => {
        card.labels?.forEach((label) => {
          map.set(label.id, label);
        });
      });
    });
    return Array.from(map.values());
  });

  const displayedColumns = $derived.by<KanbanColumn[]>(() => {
    if (!board) return [];
    if (!selectedLabelId && !searchQuery.trim()) return board.columns;

    const query = searchQuery.trim().toLowerCase();
    return board.columns.map((col) => {
      const filteredItems = col.items.filter((card) => {
        const matchesLabel =
          !selectedLabelId || card.labels?.some((l) => l.id === selectedLabelId);
        const matchesSearch =
          !query ||
          card.title.toLowerCase().includes(query) ||
          (card.description && card.description.toLowerCase().includes(query));
        return matchesLabel && matchesSearch;
      });

      return {
        ...col,
        items: filteredItems
      };
    });
  });

  async function loadBoard() {
    if (!boardId || !auth.user) {
      isLoading = false;
      return;
    }
    isLoading = true;
    errorMsg = null;
    try {
      const res = await fetchBoardDetails(boardId);
      if (res.error || !res.board) {
        errorMsg = res.error || t('errorLoadingCanvas');
      } else {
        board = res.board;
      }
    } catch (err: unknown) {
      errorMsg = err instanceof Error ? err.message : t('errorLoadingCanvas');
    } finally {
      isLoading = false;
    }
  }

  $effect(() => {
    if (!auth.loading && auth.user && !hasLoaded) {
      hasLoaded = true;
      loadBoard();
    } else if (!auth.loading && !auth.user) {
      isLoading = false;
    }
  });

  async function handleAddColumn(e: SubmitEvent) {
    e.preventDefault();
    if (!newColumnTitle.trim() || !board || isSubmittingColumn) return;

    isSubmittingColumn = true;
    try {
      const position = board.columns.length;
      const res = await createList(board.id, newColumnTitle.trim(), position);
      if (res.error || !res.data) throw new Error(res.error || 'Gagal menambah kolom');

      board.columns = [...board.columns, res.data];
      newColumnTitle = '';
      isAddingColumn = false;
    } catch (err: unknown) {
      errorMsg = err instanceof Error ? err.message : 'Gagal membuat kolom';
    } finally {
      isSubmittingColumn = false;
    }
  }

  async function handleRenameColumn(columnId: string, newTitle: string) {
    if (!board) return;
    board.columns = board.columns.map((c) =>
      c.id === columnId ? { ...c, title: newTitle } : c
    );
    await updateList(columnId, { title: newTitle });
  }

  async function handleDeleteColumn(columnId: string) {
    if (!board) return;
    const target = board.columns.find((c) => c.id === columnId);
    if (!target) return;

    const confirmed = confirm(`${t('deleteListConfirm')}`);
    if (!confirmed) return;

    board.columns = board.columns.filter((c) => c.id !== columnId);
    await deleteList(columnId);
  }

  async function handleAddCard(columnId: string, title: string) {
    if (!board) return;
    const column = board.columns.find((c) => c.id === columnId);
    if (!column) return;

    const position = column.items.length;
    const res = await createCard(columnId, title, position);
    if (res.error || !res.data) throw new Error(res.error || 'Gagal membuat kartu');

    column.items = [...column.items, res.data];
    board.columns = [...board.columns];
  }

  let savePositionsTimeout: ReturnType<typeof setTimeout> | null = null;

  function handleColumnCardsChange(columnId: string, items: KanbanCard[]) {
    if (!board) return;

    // Optimistic UI update
    const colIndex = board.columns.findIndex((c) => c.id === columnId);
    if (colIndex === -1) return;

    board.columns[colIndex].items = items;
    board.columns = [...board.columns];

    // Debounced persist to database
    if (savePositionsTimeout) clearTimeout(savePositionsTimeout);
    savePositionsTimeout = setTimeout(async () => {
      if (!board) return;
      const cardsToUpdate: { id: string; list_id: string; position: number; title: string }[] = [];

      board.columns.forEach((col) => {
        col.items.forEach((card, index) => {
          if (card.list_id !== col.id || card.position !== index) {
            card.list_id = col.id;
            card.position = index;
            cardsToUpdate.push({
              id: card.id,
              list_id: col.id,
              position: index,
              title: card.title
            });
          }
        });
      });

      if (cardsToUpdate.length > 0) {
        await updateCardsPositions(cardsToUpdate);
      }
    }, 400);
  }

  function handleColumnDndConsider(e: CustomEvent<{ items: KanbanColumn[] }>) {
    if (!board) return;
    board.columns = e.detail.items;
  }

  async function handleColumnDndFinalize(e: CustomEvent<{ items: KanbanColumn[] }>) {
    if (!board) return;
    board.columns = e.detail.items.map((col, index) => ({
      ...col,
      position: index
    }));

    const listsToUpdate = board.columns.map((col, index) => ({
      id: col.id,
      board_id: board!.id,
      title: col.title,
      position: index
    }));

    await reorderLists(listsToUpdate);
  }

  function handleUpdateCard(updated: KanbanCard) {
    if (!board) return;
    board.columns = board.columns.map((col) => ({
      ...col,
      items: col.items.map((c) => (c.id === updated.id ? updated : c))
    }));
    selectedCard = updated;
  }

  function handleDeleteCard(cardId: string) {
    if (!board) return;
    board.columns = board.columns.map((col) => ({
      ...col,
      items: col.items.filter((c) => c.id !== cardId)
    }));
    selectedCard = null;
  }

  async function handleEditBoardSubmit(title: string, color: string) {
    if (!board) return;
    const { error } = await updateBoard(board.id, { title, color });
    if (error) throw new Error(error);
    board.title = title;
    board.color = color;
  }
</script>

<div class="flex h-screen flex-col overflow-hidden bg-slate-100 text-slate-900">
  {#if board}
    <BoardHeader
      {board}
      {availableLabels}
      {selectedLabelId}
      {searchQuery}
      onSelectLabel={(id) => (selectedLabelId = id)}
      onSearchChange={(q) => (searchQuery = q)}
      onAddColumn={() => (isAddingColumn = true)}
      onEditBoard={() => (isEditBoardModalOpen = true)}
    />
  {/if}

  {#if errorMsg}
    <div class="m-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <AlertCircle class="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      <div class="flex-1">
        <p class="font-semibold">{t('troubleOccurred')}</p>
        <p class="text-xs text-red-700 mt-0.5">{errorMsg}</p>
      </div>
      <button
        type="button"
        onclick={loadBoard}
        class="rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 hover:bg-red-200"
      >
        {t('loadingCanvas')}
      </button>
    </div>
  {/if}

  {#if isLoading}
    <div class="flex flex-1 items-center justify-center">
      <div class="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 class="h-8 w-8 animate-spin text-indigo-600" />
        <p class="text-xs font-medium uppercase tracking-wider">{t('loadingCanvas')}</p>
      </div>
    </div>
  {:else if board}
    <!-- Kanban Columns Horizontal Scroll Canvas -->
    <main class="flex flex-1 items-start gap-4 overflow-x-auto p-4 sm:p-6 snap-x">
      <div
        use:dndzone={{
          items: board.columns,
          type: 'column',
          flipDurationMs: 200,
          dragDisabled: Boolean(selectedLabelId) || Boolean(searchQuery.trim()),
          dropTargetStyle: {
            outline: '2px dashed #6366F1',
            borderRadius: '1rem',
            backgroundColor: 'rgba(238, 242, 255, 0.6)'
          }
        }}
        onconsider={handleColumnDndConsider}
        onfinalize={handleColumnDndFinalize}
        class="flex items-start gap-4"
      >
        {#each (selectedLabelId || searchQuery.trim() ? displayedColumns : board.columns) as column (column.id)}
          <div class="snap-start">
            <Column
              {column}
              onRenameColumn={handleRenameColumn}
              onDeleteColumn={handleDeleteColumn}
              onAddCard={handleAddCard}
              onCardClick={(card) => (selectedCard = card)}
              onColumnCardsChange={handleColumnCardsChange}
            />
          </div>
        {/each}
      </div>

      <!-- Add Column Block -->
      <div class="w-[82vw] max-w-[310px] shrink-0 snap-start sm:w-80">
        {#if isAddingColumn}
          <form
            onsubmit={handleAddColumn}
            class="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm"
          >
            <label for="new-column-title" class="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              {t('addColumn')}
            </label>
            <input
              id="new-column-title"
              type="text"
              required
              bind:value={newColumnTitle}
              placeholder={t('newColumnPlaceholder')}
              class="block w-full min-h-[38px] rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
            <div class="mt-3 flex items-center justify-between">
              <button
                type="submit"
                disabled={isSubmittingColumn}
                class="flex min-h-[34px] items-center gap-1 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                {#if isSubmittingColumn}
                  <Loader2 class="h-3 w-3 animate-spin" />
                {/if}
                <span>{t('addColumn')}</span>
              </button>
              <button
                type="button"
                onclick={() => { isAddingColumn = false; newColumnTitle = ''; }}
                class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          </form>
        {:else}
          <button
            type="button"
            onclick={() => (isAddingColumn = true)}
            class="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300/80 bg-slate-200/40 p-4 text-xs font-semibold text-slate-600 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600 transition"
          >
            <Plus class="h-4 w-4" />
            <span>{t('addColumn')}</span>
          </button>
        {/if}
      </div>
    </main>
  {/if}
</div>

<!-- Modal Edit Board -->
{#if board}
  <BoardModal
    isOpen={isEditBoardModalOpen}
    isEditing={true}
    initialTitle={board.title}
    initialColor={board.color}
    onClose={() => (isEditBoardModalOpen = false)}
    onSubmit={handleEditBoardSubmit}
  />
{/if}

<!-- Modal Detail Kartu -->
{#if auth.user}
  <CardDetailModal
    isOpen={selectedCard !== null}
    card={selectedCard}
    userId={auth.user.id}
    onClose={() => (selectedCard = null)}
    onUpdateCard={handleUpdateCard}
    onDeleteCard={handleDeleteCard}
  />
{/if}
