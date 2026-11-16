<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '../lib/supabase/auth.svelte';
  import Navbar from '../lib/components/layout/Navbar.svelte';
  import BoardCard from '../lib/components/board/BoardCard.svelte';
  import BoardModal from '../lib/components/board/BoardModal.svelte';
  import {
    getBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    type BoardWithStats
  } from '../lib/services/board.service';
  import {
    Plus,
    Loader2,
    AlertCircle,
    Trash2,
    Layers
  } from '@lucide/svelte';

  let boards = $state<BoardWithStats[]>([]);
  let isLoading = $state(true);
  let errorMsg = $state<string | null>(null);
  let hasLoaded = $state(false);

  // Modal State
  let isModalOpen = $state(false);
  let editingBoard = $state<BoardWithStats | null>(null);

  // Delete State
  let deletingBoard = $state<BoardWithStats | null>(null);
  let isDeleting = $state(false);

  async function loadBoards() {
    if (!auth.user) {
      isLoading = false;
      return;
    }
    isLoading = true;
    errorMsg = null;
    try {
      const res = await getBoards();
      if (res.error) {
        errorMsg = res.error;
      } else {
        boards = res.data ?? [];
      }
    } catch (err: unknown) {
      errorMsg = err instanceof Error ? err.message : 'Terjadi kendala saat memuat board';
    } finally {
      isLoading = false;
    }
  }

  $effect(() => {
    if (!auth.loading && auth.user && !hasLoaded) {
      hasLoaded = true;
      loadBoards();
    } else if (!auth.loading && !auth.user) {
      isLoading = false;
    }
  });

  function handleOpenCreateModal() {
    editingBoard = null;
    isModalOpen = true;
  }

  function handleOpenEditModal(board: BoardWithStats) {
    editingBoard = board;
    isModalOpen = true;
  }

  async function handleModalSubmit(title: string, color: string) {
    if (!auth.user) return;

    if (editingBoard) {
      const { error } = await updateBoard(editingBoard.id, { title, color });
      if (error) throw new Error(error);
      boards = boards.map((b) => (b.id === editingBoard!.id ? { ...b, title, color } : b));
    } else {
      const { data, error } = await createBoard(auth.user.id, title, color);
      if (error || !data) throw new Error(error || 'Gagal membuat board');
      await loadBoards();
    }
  }

  function handleConfirmDelete(board: BoardWithStats) {
    deletingBoard = board;
  }

  async function executeDelete() {
    if (!deletingBoard) return;
    isDeleting = true;

    try {
      const { error } = await deleteBoard(deletingBoard.id);
      if (error) throw new Error(error);
      boards = boards.filter((b) => b.id !== deletingBoard!.id);
      deletingBoard = null;
    } catch (err: unknown) {
      errorMsg = err instanceof Error ? err.message : 'Gagal menghapus board.';
    } finally {
      isDeleting = false;
    }
  }
</script>

<div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
  <Navbar onOpenNewBoard={handleOpenCreateModal} />

  <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
    <!-- Header Banner -->
    <div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Daftar Board Saya
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          Pilih board untuk melihat tugas atau buat alur kerja baru.
        </p>
      </div>

      <button
        type="button"
        onclick={handleOpenCreateModal}
        class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-indigo-800"
      >
        <Plus class="h-4 w-4" />
        <span>Buat Board Baru</span>
      </button>
    </div>

    {#if errorMsg}
      <div class="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <AlertCircle class="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div class="flex-1">
          <p class="font-semibold">Terjadi kendala</p>
          <p class="text-xs text-red-700 mt-0.5">{errorMsg}</p>
        </div>
        <button
          type="button"
          onclick={loadBoards}
          class="rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 hover:bg-red-200"
        >
          Coba Lagi
        </button>
      </div>
    {/if}

    {#if isLoading}
      <div class="flex min-h-[300px] items-center justify-center">
        <div class="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 class="h-8 w-8 animate-spin text-indigo-600" />
          <p class="text-xs font-medium uppercase tracking-wider">Memuat board Anda...</p>
        </div>
      </div>
    {:else if boards.length === 0}
      <!-- Empty State -->
      <div class="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center sm:p-12">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-xs">
          <Layers class="h-8 w-8" />
        </div>
        <h2 class="text-lg font-bold text-slate-900 sm:text-xl">
          Belum Ada Board
        </h2>
        <p class="mt-1.5 max-w-md text-sm text-slate-500 leading-relaxed">
          KanbanKu membantu Anda memvisualisasikan to-do dan proyek harian. Mulai dengan membuat board pertama Anda.
        </p>
        <button
          type="button"
          onclick={handleOpenCreateModal}
          class="mt-6 flex min-h-[44px] items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-indigo-800"
        >
          <Plus class="h-4 w-4" />
          <span>Buat Board Pertama</span>
        </button>
      </div>
    {:else}
      <!-- Boards Grid -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {#each boards as board (board.id)}
          <BoardCard
            {board}
            onEdit={handleOpenEditModal}
            onDelete={handleConfirmDelete}
          />
        {/each}
      </div>
    {/if}
  </main>
</div>

<!-- Modal Create / Edit Board -->
<BoardModal
  isOpen={isModalOpen}
  isEditing={editingBoard !== null}
  initialTitle={editingBoard?.title ?? ''}
  initialColor={editingBoard?.color ?? '#6366F1'}
  onClose={() => isModalOpen = false}
  onSubmit={handleModalSubmit}
/>

<!-- Modal Konfirmasi Hapus -->
{#if deletingBoard}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      role="presentation"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
      onclick={() => !isDeleting && (deletingBoard = null)}
    ></div>

    <div
      role="dialog"
      aria-modal="true"
      class="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
    >
      <div class="flex items-center gap-3 text-red-600">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
          <Trash2 class="h-5 w-5" />
        </div>
        <h3 class="text-base font-bold text-slate-900">Hapus Board?</h3>
      </div>

      <p class="mt-3 text-sm text-slate-600 leading-relaxed">
        Apakah Anda yakin ingin menghapus board <span class="font-semibold text-slate-900">"{deletingBoard.title}"</span>? Semua kolom dan kartu di dalamnya akan dihapus secara permanen.
      </p>

      <div class="mt-6 flex items-center justify-end gap-2.5">
        <button
          type="button"
          disabled={isDeleting}
          onclick={() => deletingBoard = null}
          class="min-h-[40px] rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
        >
          Batal
        </button>
        <button
          type="button"
          disabled={isDeleting}
          onclick={executeDelete}
          class="flex min-h-[40px] items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-300 sm:text-sm"
        >
          {#if isDeleting}
            <Loader2 class="h-4 w-4 animate-spin" />
          {/if}
          <span>Hapus</span>
        </button>
      </div>
    </div>
  </div>
{/if}
