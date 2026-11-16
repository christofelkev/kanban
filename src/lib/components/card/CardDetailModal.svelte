<script lang="ts">
  import type { KanbanCard, LabelRow, CommentRow } from '../../types/kanban.types';
  import {
    updateCard,
    deleteCard,
    getLabels,
    createLabel,
    assignLabelToCard,
    removeLabelFromCard
  } from '../../services/card.service';
  import {
    fetchComments,
    addComment,
    deleteComment
  } from '../../services/comment.service';
  import {
    X,
    Calendar,
    Tag,
    AlignLeft,
    MessageSquare,
    Trash2,
    Plus,
    Loader2,
    Check,
    Clock
  } from '@lucide/svelte';
  import { format } from 'date-fns';
  import { id as localeId } from 'date-fns/locale';

  interface Props {
    isOpen: boolean;
    card: KanbanCard | null;
    userId: string;
    onClose: () => void;
    onUpdateCard: (updatedCard: KanbanCard) => void;
    onDeleteCard: (cardId: string) => void;
  }

  let {
    isOpen,
    card,
    userId,
    onClose,
    onUpdateCard,
    onDeleteCard
  }: Props = $props();

  // Local card state
  let title = $state('');
  let description = $state('');
  let dueDateInput = $state('');
  let cardLabels = $state<LabelRow[]>([]);

  // User Labels & Comments
  let allUserLabels = $state<LabelRow[]>([]);
  let comments = $state<CommentRow[]>([]);
  let newCommentText = $state('');
  let isLoadingComments = $state(false);
  let isSubmittingComment = $state(false);

  // Label Manager Popover
  let isLabelMenuOpen = $state(false);
  let isCreatingLabel = $state(false);
  let newLabelName = $state('');
  let newLabelColor = $state('#3B82F6');

  // Saving states
  let isSavingDesc = $state(false);
  let isDeletingCard = $state(false);

  const labelColorPresets = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#64748B'  // Slate
  ];

  $effect(() => {
    if (isOpen && card) {
      title = card.title;
      description = card.description || '';
      dueDateInput = card.due_date ? card.due_date.split('T')[0] : '';
      cardLabels = [...card.labels];
      loadUserLabels();
      loadComments(card.id);
    }
  });

  async function loadUserLabels() {
    if (!userId) return;
    const res = await getLabels(userId);
    if (res.data) allUserLabels = res.data;
  }

  async function loadComments(cardId: string) {
    isLoadingComments = true;
    const res = await fetchComments(cardId);
    if (res.data) comments = res.data;
    isLoadingComments = false;
  }

  async function handleTitleBlur() {
    if (!card || !title.trim() || title.trim() === card.title) return;
    const newTitle = title.trim();
    const updated = { ...card, title: newTitle };
    onUpdateCard(updated);
    await updateCard(card.id, { title: newTitle });
  }

  async function handleSaveDescription() {
    if (!card) return;
    isSavingDesc = true;
    try {
      const updated = { ...card, description };
      onUpdateCard(updated);
      await updateCard(card.id, { description });
    } finally {
      isSavingDesc = false;
    }
  }

  async function handleDueDateChange(e: Event) {
    if (!card) return;
    const target = e.target as HTMLInputElement;
    const val = target.value;
    const newDueDate = val ? new Date(val).toISOString() : null;
    const updated = { ...card, due_date: newDueDate };
    onUpdateCard(updated);
    await updateCard(card.id, { due_date: newDueDate });
  }

  async function handleClearDueDate() {
    if (!card) return;
    dueDateInput = '';
    const updated = { ...card, due_date: null };
    onUpdateCard(updated);
    await updateCard(card.id, { due_date: null });
  }

  async function handleToggleLabel(label: LabelRow) {
    if (!card) return;
    const exists = cardLabels.some((l) => l.id === label.id);
    if (exists) {
      cardLabels = cardLabels.filter((l) => l.id !== label.id);
      const updated = { ...card, labels: cardLabels };
      onUpdateCard(updated);
      await removeLabelFromCard(card.id, label.id);
    } else {
      cardLabels = [...cardLabels, label];
      const updated = { ...card, labels: cardLabels };
      onUpdateCard(updated);
      await assignLabelToCard(card.id, label.id);
    }
  }

  async function handleCreateNewLabel(e: SubmitEvent) {
    e.preventDefault();
    if (!newLabelName.trim()) return;

    const res = await createLabel(userId, newLabelName.trim(), newLabelColor);
    if (res.data) {
      allUserLabels = [...allUserLabels, res.data];
      await handleToggleLabel(res.data);
      newLabelName = '';
      isCreatingLabel = false;
    }
  }

  async function handleAddComment(e: SubmitEvent) {
    e.preventDefault();
    if (!card || !newCommentText.trim() || isSubmittingComment) return;

    isSubmittingComment = true;
    try {
      const res = await addComment(card.id, userId, newCommentText.trim());
      if (res.data) {
        comments = [...comments, res.data];
        newCommentText = '';
      }
    } finally {
      isSubmittingComment = false;
    }
  }

  async function handleDeleteComment(commentId: string) {
    comments = comments.filter((c) => c.id !== commentId);
    await deleteComment(commentId);
  }

  async function handleDeleteCardClick() {
    if (!card) return;
    const confirmed = confirm(`Hapus kartu "${card.title}" secara permanen?`);
    if (!confirmed) return;

    isDeletingCard = true;
    try {
      await deleteCard(card.id);
      onDeleteCard(card.id);
      onClose();
    } finally {
      isDeletingCard = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && card}
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <!-- Backdrop -->
    <div
      role="presentation"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      onclick={onClose}
    ></div>

    <!-- Modal Content (Bottom Sheet on Mobile, Dialog on Desktop) -->
    <div
      role="dialog"
      aria-modal="true"
      class="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
    >
      <!-- Modal Header -->
      <div class="flex items-start justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
        <div class="flex-1 mr-3">
          <input
            type="text"
            bind:value={title}
            onblur={handleTitleBlur}
            class="w-full text-base sm:text-lg font-bold text-slate-900 bg-transparent rounded-md px-1.5 py-1 border border-transparent hover:border-slate-300 focus:border-indigo-600 focus:bg-white focus:outline-none transition"
          />
        </div>

        <button
          type="button"
          onclick={onClose}
          aria-label="Tutup modal"
          class="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 focus:outline-none"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <!-- Labels & Due Date Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Labels Section -->
          <div>
            <div class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <Tag class="h-3.5 w-3.5" />
              <span>Label / Tag</span>
            </div>

            <div class="flex flex-wrap items-center gap-1.5">
              {#each cardLabels as label (label.id)}
                <span
                  class="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-2xs"
                  style="background-color: {label.color || '#3B82F6'}"
                >
                  <span>{label.name}</span>
                  <button
                    type="button"
                    onclick={() => handleToggleLabel(label)}
                    aria-label="Hapus label"
                    class="hover:opacity-80"
                  >
                    <X class="h-3 w-3" />
                  </button>
                </span>
              {/each}

              <!-- Add Label Button / Popover -->
              <div class="relative">
                <button
                  type="button"
                  onclick={() => (isLabelMenuOpen = !isLabelMenuOpen)}
                  class="flex items-center gap-1 rounded-full border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                >
                  <Plus class="h-3 w-3" />
                  <span>Tambah Label</span>
                </button>

                {#if isLabelMenuOpen}
                  <div class="absolute left-0 top-8 z-30 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                    <div class="mb-2 flex items-center justify-between pb-1 border-b border-slate-100">
                      <span class="text-xs font-bold text-slate-700">Pilih Label</span>
                      <button
                        type="button"
                        onclick={() => { isLabelMenuOpen = false; isCreatingLabel = false; }}
                        class="text-slate-400 hover:text-slate-600"
                      >
                        <X class="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div class="max-h-40 overflow-y-auto space-y-1 mb-2">
                      {#each allUserLabels as label (label.id)}
                        {@const isAssigned = cardLabels.some((l) => l.id === label.id)}
                        <button
                          type="button"
                          onclick={() => handleToggleLabel(label)}
                          class="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs text-left hover:bg-slate-50 transition"
                        >
                          <div class="flex items-center gap-2">
                            <span class="h-3 w-3 rounded-full" style="background-color: {label.color}"></span>
                            <span class="font-medium text-slate-800">{label.name}</span>
                          </div>
                          {#if isAssigned}
                            <Check class="h-3.5 w-3.5 text-indigo-600" />
                          {/if}
                        </button>
                      {/each}
                    </div>

                    {#if isCreatingLabel}
                      <form onsubmit={handleCreateNewLabel} class="pt-2 border-t border-slate-100 space-y-2">
                        <input
                          type="text"
                          required
                          bind:value={newLabelName}
                          placeholder="Nama label..."
                          class="w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                        />
                        <div class="flex gap-1.5">
                          {#each labelColorPresets as preset}
                            <button
                              type="button"
                              title="Pilih warna {preset}"
                              aria-label="Pilih warna {preset}"
                              onclick={() => (newLabelColor = preset)}
                              style="background-color: {preset}"
                              class="h-5 w-5 rounded-full {newLabelColor === preset ? 'ring-2 ring-indigo-600 ring-offset-1' : ''}"
                            ></button>
                          {/each}
                        </div>
                        <div class="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onclick={() => (isCreatingLabel = false)}
                            class="rounded px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            class="rounded bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700"
                          >
                            Buat
                          </button>
                        </div>
                      </form>
                    {:else}
                      <button
                        type="button"
                        onclick={() => (isCreatingLabel = true)}
                        class="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        <Plus class="h-3 w-3" />
                        <span>Buat Label Baru</span>
                      </button>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
          </div>

          <!-- Due Date Section -->
          <div>
            <div class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <Calendar class="h-3.5 w-3.5" />
              <span>Tenggat Waktu (Due Date)</span>
            </div>

            <div class="flex items-center gap-2">
              <input
                type="date"
                bind:value={dueDateInput}
                onchange={handleDueDateChange}
                class="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
              {#if dueDateInput}
                <button
                  type="button"
                  onclick={handleClearDueDate}
                  title="Hapus tenggat waktu"
                  class="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-red-600"
                >
                  Hapus
                </button>
              {/if}
            </div>
          </div>
        </div>

        <!-- Description Section -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <AlignLeft class="h-3.5 w-3.5" />
              <span>Deskripsi Tugas</span>
            </div>
            {#if isSavingDesc}
              <span class="flex items-center gap-1 text-[11px] text-indigo-600">
                <Loader2 class="h-3 w-3 animate-spin" />
                <span>Menyimpan...</span>
              </span>
            {/if}
          </div>

          <textarea
            rows="4"
            bind:value={description}
            onblur={handleSaveDescription}
            placeholder="Tuliskan catatan detail, checklist, atau instruksi tugas di sini..."
            class="block w-full resize-y rounded-xl border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          ></textarea>
        </div>

        <!-- Comments / Personal Notes Section -->
        <div>
          <div class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            <MessageSquare class="h-3.5 w-3.5" />
            <span>Catatan & Komentar ({comments.length})</span>
          </div>

          <!-- Add Comment Box -->
          <form onsubmit={handleAddComment} class="mb-4 space-y-2">
            <textarea
              required
              rows="2"
              bind:value={newCommentText}
              placeholder="Tulis catatan atau progres tugas..."
              class="block w-full resize-none rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            ></textarea>
            <div class="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingComment}
                class="flex min-h-[34px] items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                {#if isSubmittingComment}
                  <Loader2 class="h-3 w-3 animate-spin" />
                {/if}
                <span>Kirim Catatan</span>
              </button>
            </div>
          </form>

          <!-- Comment List -->
          {#if isLoadingComments}
            <div class="flex items-center justify-center py-4">
              <Loader2 class="h-5 w-5 animate-spin text-slate-400" />
            </div>
          {:else if comments.length === 0}
            <p class="text-xs text-slate-400 italic">Belum ada catatan pada kartu ini.</p>
          {:else}
            <div class="space-y-3">
              {#each comments as comment (comment.id)}
                <div class="group relative rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs">
                  <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span class="flex items-center gap-1">
                      <Clock class="h-3 w-3" />
                      {format(new Date(comment.created_at), 'd MMM yyyy, HH:mm', { locale: localeId })}
                    </span>
                    <button
                      type="button"
                      onclick={() => handleDeleteComment(comment.id)}
                      title="Hapus catatan"
                      class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition"
                    >
                      <Trash2 class="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p class="text-slate-800 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Modal Footer (Danger Zone) -->
      <div class="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 p-4 sm:px-6">
        <button
          type="button"
          disabled={isDeletingCard}
          onclick={handleDeleteCardClick}
          class="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <Trash2 class="h-3.5 w-3.5 text-red-600" />
          <span>Hapus Kartu</span>
        </button>

        <button
          type="button"
          onclick={onClose}
          class="min-h-[38px] rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
        >
          Selesai
        </button>
      </div>
    </div>
  </div>
{/if}
