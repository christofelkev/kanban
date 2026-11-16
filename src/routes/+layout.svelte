<script lang="ts">
  import './layout.css';
  import favicon from '#lib/assets/favicon.svg';
  import type { LayoutProps } from './$types';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { auth } from '../lib/supabase/auth.svelte';
  import { isSupabaseConfigured } from '../lib/supabase/client';
  import { Loader2, KeyRound, Database, ExternalLink, FileCode } from '@lucide/svelte';

  let { children }: LayoutProps = $props();

  onMount(() => {
    if (isSupabaseConfigured) {
      auth.init();
    }
  });

  $effect(() => {
    if (!isSupabaseConfigured || auth.loading) return;

    const pathname = page.url.pathname;
    const isAuthRoute = pathname.startsWith('/auth');

    if (!auth.user && !isAuthRoute) {
      goto('/auth', { replaceState: true });
    } else if (auth.user && isAuthRoute && pathname !== '/auth/callback') {
      goto('/', { replaceState: true });
    }
  });
</script>

<svelte:head>
  <title>KanbanKu - Personal Kanban Board</title>
  <link rel="icon" type="image/svg+xml" href={favicon} />
</svelte:head>

{#if !isSupabaseConfigured}
  <!-- Setup Supabase Onboarding Screen -->
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
    <div class="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div class="flex items-center gap-3 border-b border-slate-100 pb-5">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Database class="h-6 w-6" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-slate-900">Setup Database Supabase</h1>
          <p class="text-xs text-slate-500">Konfigurasikan kunci API Supabase untuk menghubungkan database.</p>
        </div>
      </div>

      <div class="mt-6 space-y-5 text-sm text-slate-700">
        <!-- Step 1 -->
        <div class="flex items-start gap-3">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">1</span>
          <div>
            <p class="font-semibold text-slate-900">Buat Project Supabase (Gratis)</p>
            <p class="mt-0.5 text-xs text-slate-500 leading-relaxed">
              Buka <a href="https://database.new" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline">database.new <ExternalLink class="h-3 w-3" /></a>, login, dan buat project baru.
            </p>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="flex items-start gap-3">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">2</span>
          <div>
            <p class="font-semibold text-slate-900">Ambil Project URL & Anon Key</p>
            <p class="mt-0.5 text-xs text-slate-500 leading-relaxed">
              Masuk ke <strong>Project Settings &rarr; Data API (atau API Keys)</strong> di dashboard Supabase. Copy <code>Project URL</code> dan <code>anon public key</code>.
            </p>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="flex items-start gap-3">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">3</span>
          <div class="w-full">
            <p class="font-semibold text-slate-900">Isi File .env di Project</p>
            <p class="mt-0.5 text-xs text-slate-500 leading-relaxed">
              Buka file <code class="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-indigo-700">.env</code> di root folder kanban, lalu ganti isinya dengan kunci asli kamu:
            </p>
            <pre class="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-200"><code>PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...</code></pre>
          </div>
        </div>

        <!-- Step 4 -->
        <div class="flex items-start gap-3">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">4</span>
          <div>
            <p class="font-semibold text-slate-900">Jalankan Schema SQL</p>
            <p class="mt-0.5 text-xs text-slate-500 leading-relaxed">
              Di dashboard Supabase, buka menu <strong>SQL Editor</strong>, lalu copy-paste dan jalankan isi dari file <code class="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-indigo-700">supabase/schema.sql</code>.
            </p>
          </div>
        </div>
      </div>

      <div class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
        Setelah mengisi file <code>.env</code>, halaman ini akan otomatis memuat aplikasi KanbanKu!
      </div>
    </div>
  </div>
{:else if auth.loading}
  <div class="flex min-h-screen items-center justify-center bg-slate-50">
    <div class="flex flex-col items-center gap-3 text-slate-500">
      <Loader2 class="h-8 w-8 animate-spin text-indigo-600" />
      <span class="text-xs font-medium tracking-wide uppercase">Memuat KanbanKu...</span>
    </div>
  </div>
{:else}
  {@render children()}
{/if}
