<script lang="ts">
  import { i18n } from '../../i18n/index.svelte';
  import { Globe } from '@lucide/svelte';

  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();
</script>

<div
  class="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 text-xs font-medium text-slate-600 backdrop-blur-sm {className}"
  role="group"
  aria-label="Language Switcher"
>
  <div class="flex items-center px-1.5 py-1 text-slate-400">
    <Globe class="h-3.5 w-3.5" />
  </div>
  <button
    type="button"
    onclick={() => i18n.setLocale('en')}
    class="rounded-md px-2 py-1 text-xs transition-all {i18n.locale === 'en'
      ? 'bg-white font-bold text-indigo-600 shadow-xs'
      : 'text-slate-500 hover:text-slate-800'}"
    aria-label="Switch to English"
    aria-pressed={i18n.locale === 'en'}
  >
    EN
  </button>
  <button
    type="button"
    onclick={() => i18n.setLocale('id')}
    class="rounded-md px-2 py-1 text-xs transition-all {i18n.locale === 'id'
      ? 'bg-white font-bold text-indigo-600 shadow-xs'
      : 'text-slate-500 hover:text-slate-800'}"
    aria-label="Ganti ke Bahasa Indonesia"
    aria-pressed={i18n.locale === 'id'}
  >
    ID
  </button>
</div>
