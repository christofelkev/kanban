<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '../../lib/supabase/auth.svelte';
  import { Loader2, Mail, Lock, AlertCircle, CheckCircle2 } from '@lucide/svelte';

  type Mode = 'login' | 'register' | 'forgot';

  let mode = $state<Mode>('login');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let errorMsg = $state<string | null>(null);
  let successMsg = $state<string | null>(null);
  let isSubmitting = $state(false);

  onMount(() => {
    auth.init();
  });

  $effect(() => {
    if (!auth.loading && auth.user) {
      goto('/', { replaceState: true });
    }
  });

  function switchMode(newMode: Mode) {
    mode = newMode;
    errorMsg = null;
    successMsg = null;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    errorMsg = null;
    successMsg = null;

    if (!email.trim()) {
      errorMsg = 'Silakan masukkan alamat email yang valid.';
      return;
    }

    if (mode !== 'forgot' && !password) {
      errorMsg = 'Silakan masukkan kata sandi Anda.';
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        errorMsg = 'Kata sandi minimal harus 6 karakter.';
        return;
      }
      if (password !== confirmPassword) {
        errorMsg = 'Konfirmasi kata sandi tidak cocok.';
        return;
      }
    }

    isSubmitting = true;

    try {
      if (mode === 'login') {
        const { error } = await auth.signInWithEmail(email, password);
        if (error) {
          errorMsg = error.message;
        } else {
          goto('/', { replaceState: true });
        }
      } else if (mode === 'register') {
        const { error, data } = await auth.signUpWithEmail(email, password);
        if (error) {
          errorMsg = error.message;
        } else if (data.user && data.session === null) {
          successMsg = 'Registrasi berhasil! Silakan cek kotak masuk email Anda untuk konfirmasi aktivasi akun.';
        } else {
          goto('/', { replaceState: true });
        }
      } else if (mode === 'forgot') {
        const { error } = await auth.resetPassword(email);
        if (error) {
          errorMsg = error.message;
        } else {
          successMsg = 'Tautan reset kata sandi telah dikirim ke email Anda.';
        }
      }
    } catch (err: unknown) {
      errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem. Silakan coba lagi.';
    } finally {
      isSubmitting = false;
    }
  }

  async function handleGoogleLogin() {
    errorMsg = null;
    try {
      const { error } = await auth.signInWithGoogle();
      if (error) {
        errorMsg = error.message;
      }
    } catch (err: unknown) {
      errorMsg = err instanceof Error ? err.message : 'Gagal menghubungi layanan Google.';
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
  <div class="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
    <div class="mb-6 text-center">
      <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <span class="text-2xl font-bold tracking-tight">K</span>
      </div>
      <h1 class="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        {#if mode === 'login'}
          Masuk ke KanbanKu
        {:else if mode === 'register'}
          Buat Akun KanbanKu
        {:else}
          Reset Kata Sandi
        {/if}
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        {#if mode === 'login'}
          Kelola to-do dan proyek harian Anda dengan mudah.
        {:else if mode === 'register'}
          Mulai atur alur kerja Anda secara terstruktur.
        {:else}
          Masukkan email yang terdaftar untuk menerima tautan pemulihan.
        {/if}
      </p>
    </div>

    {#if errorMsg}
      <div class="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
        <AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
        <span class="leading-relaxed">{errorMsg}</span>
      </div>
    {/if}

    {#if successMsg}
      <div class="mb-5 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800">
        <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <span class="leading-relaxed">{successMsg}</span>
      </div>
    {/if}

    {#if mode !== 'forgot'}
      <button
        type="button"
        onclick={handleGoogleLogin}
        class="flex w-full min-h-[44px] items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 active:bg-slate-100"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.09C3.25 21.35 7.34 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.41l4.02-3.09z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.65 1.26 6.59l4.02 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
          />
        </svg>
        Lanjutkan dengan Google
      </button>

      <div class="relative my-5">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-slate-200"></div>
        </div>
        <div class="relative flex justify-center text-xs uppercase tracking-wider text-slate-400">
          <span class="bg-white px-2">atau</span>
        </div>
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-4">
      <div>
        <label for="email" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Alamat Email
        </label>
        <div class="relative">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Mail class="h-4 w-4" />
          </div>
          <input
            id="email"
            type="email"
            required
            autocomplete="email"
            bind:value={email}
            placeholder="nama@email.com"
            class="block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>
      </div>

      {#if mode !== 'forgot'}
        <div>
          <div class="mb-1.5 flex items-center justify-between">
            <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Kata Sandi
            </label>
            {#if mode === 'login'}
              <button
                type="button"
                onclick={() => switchMode('forgot')}
                class="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Lupa sandi?
              </button>
            {/if}
          </div>
          <div class="relative">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock class="h-4 w-4" />
            </div>
            <input
              id="password"
              type="password"
              required
              minlength="6"
              autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
              bind:value={password}
              placeholder="Minimal 6 karakter"
              class="block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
        </div>
      {/if}

      {#if mode === 'register'}
        <div>
          <label for="confirmPassword" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Konfirmasi Kata Sandi
          </label>
          <div class="relative">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock class="h-4 w-4" />
            </div>
            <input
              id="confirmPassword"
              type="password"
              required
              minlength="6"
              autocomplete="new-password"
              bind:value={confirmPassword}
              placeholder="Ulangi kata sandi"
              class="block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
        </div>
      {/if}

      <button
        type="submit"
        disabled={isSubmitting}
        class="mt-2 flex w-full min-h-[44px] items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-300"
      >
        {#if isSubmitting}
          <Loader2 class="h-4 w-4 animate-spin" />
        {:else if mode === 'login'}
          Masuk
        {:else if mode === 'register'}
          Daftar Akun
        {:else}
          Kirim Tautan Reset
        {/if}
      </button>
    </form>

    <div class="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-600">
      {#if mode === 'login'}
        Belum punya akun?
        <button
          type="button"
          onclick={() => switchMode('register')}
          class="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          Daftar sekarang
        </button>
      {:else if mode === 'register'}
        Sudah memiliki akun?
        <button
          type="button"
          onclick={() => switchMode('login')}
          class="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          Masuk
        </button>
      {:else}
        Kembali ke
        <button
          type="button"
          onclick={() => switchMode('login')}
          class="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          Halaman Masuk
        </button>
      {/if}
    </div>
  </div>
</div>
