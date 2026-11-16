<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '../../lib/supabase/auth.svelte';
  import { t } from '../../lib/i18n/index.svelte';
  import Logo from '../../lib/components/ui/Logo.svelte';
  import LanguageSwitcher from '../../lib/components/ui/LanguageSwitcher.svelte';
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
      errorMsg = t('enterValidEmail');
      return;
    }

    if (mode !== 'forgot' && !password) {
      errorMsg = t('enterPassword');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        errorMsg = t('passwordMinLength');
        return;
      }
      if (password !== confirmPassword) {
        errorMsg = t('passwordsDoNotMatch');
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
          successMsg = t('authSuccessRegister');
        } else {
          goto('/', { replaceState: true });
        }
      } else if (mode === 'forgot') {
        const { error } = await auth.resetPassword(email);
        if (error) {
          errorMsg = error.message;
        } else {
          successMsg = t('resetLinkSent');
        }
      }
    } catch (err: unknown) {
      errorMsg = err instanceof Error ? err.message : t('authErrorGeneric');
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
      errorMsg = err instanceof Error ? err.message : t('googleAuthError');
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
  <div class="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
    <div class="mb-4 flex justify-end">
      <LanguageSwitcher />
    </div>

    <div class="mb-6 text-center">
      <Logo size={52} class="mx-auto mb-3.5 shadow-sm rounded-2xl" />
      <h1 class="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        {#if mode === 'login'}
          {t('loginTitle')}
        {:else if mode === 'register'}
          {t('registerTitle')}
        {:else}
          {t('forgotPasswordTitle')}
        {/if}
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        {#if mode === 'login'}
          {t('loginSubtitle')}
        {:else if mode === 'register'}
          {t('registerSubtitle')}
        {:else}
          {t('forgotPasswordSubtitle')}
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
        {t('googleSignIn')}
      </button>

      <div class="relative my-5">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-slate-200"></div>
        </div>
        <div class="relative flex justify-center text-xs uppercase tracking-wider text-slate-400">
          <span class="bg-white px-2">{t('or')}</span>
        </div>
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-4">
      <div>
        <label for="email" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {t('emailLabel')}
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
            placeholder={t('emailPlaceholder')}
            class="block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>
      </div>

      {#if mode !== 'forgot'}
        <div>
          <div class="mb-1.5 flex items-center justify-between">
            <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              {t('passwordLabel')}
            </label>
            {#if mode === 'login'}
              <button
                type="button"
                onclick={() => switchMode('forgot')}
                class="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                {t('forgotPassword')}
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
              placeholder={t('passwordPlaceholder')}
              class="block w-full min-h-[44px] rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
        </div>
      {/if}

      {#if mode === 'register'}
        <div>
          <label for="confirmPassword" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
            {t('confirmPasswordLabel')}
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
              placeholder={t('confirmPasswordPlaceholder')}
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
          {t('signInButton')}
        {:else if mode === 'register'}
          {t('signUpButton')}
        {:else}
          {t('sendResetLink')}
        {/if}
      </button>
    </form>

    <div class="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-600">
      {#if mode === 'login'}
        {t('dontHaveAccount')}
        <button
          type="button"
          onclick={() => switchMode('register')}
          class="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          {t('signUpHere')}
        </button>
      {:else if mode === 'register'}
        {t('alreadyHaveAccount')}
        <button
          type="button"
          onclick={() => switchMode('login')}
          class="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          {t('signInHere')}
        </button>
      {:else}
        {t('backTo')}
        <button
          type="button"
          onclick={() => switchMode('login')}
          class="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          {t('backToSignIn')}
        </button>
      {/if}
    </div>
  </div>
</div>
