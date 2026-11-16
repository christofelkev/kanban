<script lang="ts">
  import { Loader2, X, Check } from '@lucide/svelte';

  interface Props {
    isOpen: boolean;
    initialTitle?: string;
    initialColor?: string;
    isEditing?: boolean;
    onClose: () => void;
    onSubmit: (title: string, color: string) => Promise<void>;
  }

  let {
    isOpen,
    initialTitle = '',
    initialColor = '#6366F1',
    isEditing = false,
    onClose,
    onSubmit
  }: Props = $props();

  const colorPresets = [
    { label: 'Indigo', value: '#6366F1' },
    { label: 'Blue', value: '#3B82F6' },
    { label: 'Emerald', value: '#10B981' },
    { label: 'Amber', value: '#F59E0B' },
    { label: 'Rose', value: '#F43F5E' },
    { label: 'Purple', value: '#A855F7' },
    { label: 'Slate', value: '#64748B' }
  ];

  let title = $state('');
  let selectedColor = $state('#6366F1');
  let isSubmitting = $state(false);
  let errorMsg = $state<string | null>(null);

  $effect(() => {
    if (isOpen) {
      title = initialTitle;
      selectedColor = initialColor || '#6366F1';
      errorMsg = null;
      isSubmitting = false;
    }
  });

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!title.trim()) {
      errorMsg = 'Judul board tidak boleh kosong.';
      return;
    }

    isSubmitting = true;
    errorMsg = null;

    try {
      await onSubmit(title.trim(), selectedColor);
      onClose();
    } catch (err: unknown) {
      errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan board.';
    } finally {
      isSubmitting = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen && !isSubmitting) {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div
      role="presentation"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      onclick={() => !isSubmitting && onClose()}
    ></div>

    <!-- Modal Dialog -->
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="board-modal-title"
      class="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl transition-all"
    >
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <h2 id="board-modal-title" class="text-lg font-bold text-slate-900">
          {isEditing ? 'Ubah Board' : 'Buat Board Baru'}
        </h2>
        <button
          type="button"
          disabled={isSubmitting}
          onclick={onClose}
          class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      {#if errorMsg}
        <div class="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          {errorMsg}
        </div>
      {/if}

      <form onsubmit={handleSubmit} class="mt-4 space-y-4">
        <div>
          <label for="board-title" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Judul Board
          </label>
          <input
            id="board-title"
            type="text"
            required
            bind:value={title}
            placeholder="Contoh: Pekerjaan, Proyek Website, Belajar"
            class="block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>

        <div>
          <span class="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Warna Tema
          </span>
          <div class="flex flex-wrap gap-2.5">
            {#each colorPresets as preset}
              <button
                type="button"
                title={preset.label}
                onclick={() => selectedColor = preset.value}
                style="background-color: {preset.value}"
                class="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
              >
                {#if selectedColor === preset.value}
                  <Check class="h-4 w-4 stroke-[3]" />
                {/if}
              </button>
            {/each}
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onclick={onClose}
            class="min-h-[40px] rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            class="flex min-h-[40px] items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 sm:text-sm"
          >
            {#if isSubmitting}
              <Loader2 class="h-4 w-4 animate-spin" />
            {/if}
            <span>{isEditing ? 'Simpan Perubahan' : 'Buat Board'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
