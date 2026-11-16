<script lang="ts">
  import type { KanbanCard, DueDateStatus } from '../../types/kanban.types';
  import { i18n } from '../../i18n/index.svelte';
  import { Calendar, Clock, AlertTriangle, CheckSquare } from '@lucide/svelte';
  import { format, isPast, isToday, addHours } from 'date-fns';
  import { id as localeId, enUS } from 'date-fns/locale';

  interface Props {
    card: KanbanCard;
    onClick: () => void;
  }

  let { card, onClick }: Props = $props();

  const dueDateStatus = $derived.by<DueDateStatus>(() => {
    if (!card.due_date) return null;
    const date = new Date(card.due_date);
    if (isPast(date) && !isToday(date)) return 'overdue';
    const in24Hours = addHours(new Date(), 24);
    if (date <= in24Hours) return 'warning';
    return 'normal';
  });

  const formattedDueDate = $derived.by<string | null>(() => {
    if (!card.due_date) return null;
    try {
      return format(new Date(card.due_date), 'd MMM', {
        locale: i18n.locale === 'id' ? localeId : enUS
      });
    } catch {
      return null;
    }
  });

  const checklistStats = $derived.by(() => {
    if (!card.checklists || card.checklists.length === 0) return null;
    const total = card.checklists.length;
    const completed = card.checklists.filter((c) => c.is_completed).length;
    const percent = Math.round((completed / total) * 100);
    return { total, completed, percent };
  });
</script>

<div
  role="button"
  tabindex="0"
  onclick={onClick}
  onkeydown={(e) => e.key === 'Enter' && onClick()}
  class="group relative flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white shadow-xs transition hover:border-indigo-300 hover:shadow-md cursor-pointer select-none overflow-hidden"
>
  <!-- Cover Color Top Bar -->
  {#if card.cover_color}
    <div class="h-2 w-full shrink-0" style="background-color: {card.cover_color}"></div>
  {/if}

  <div class="p-3.5 pt-2.5 flex flex-col gap-2">
    <!-- Labels Row -->
    {#if card.labels && card.labels.length > 0}
      <div class="flex flex-wrap gap-1.5">
        {#each card.labels as label (label.id)}
          <span
            class="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white tracking-wide"
            style="background-color: {label.color || '#3B82F6'}"
          >
            {label.name}
          </span>
        {/each}
      </div>
    {/if}

    <!-- Card Title -->
    <h4 class="text-sm font-medium text-slate-800 leading-snug break-words">
      {card.title}
    </h4>

    <!-- Checklist Progress Bar & Stats -->
    {#if checklistStats}
      <div class="mt-0.5 space-y-1">
        <div class="flex items-center justify-between text-[11px] font-medium {checklistStats.completed === checklistStats.total ? 'text-emerald-600' : 'text-slate-500'}">
          <div class="flex items-center gap-1">
            <CheckSquare class="h-3 w-3" />
            <span>{checklistStats.completed}/{checklistStats.total}</span>
          </div>
          <span class="text-[10px]">{checklistStats.percent}%</span>
        </div>
        <div class="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-300 {checklistStats.completed === checklistStats.total ? 'bg-emerald-500' : 'bg-indigo-600'}"
            style="width: {checklistStats.percent}%"
          ></div>
        </div>
      </div>
    {/if}

    <!-- Card Footer Info -->
    {#if card.due_date || card.description}
      <div class="mt-0.5 flex items-center justify-between text-xs text-slate-400">
        <div class="flex items-center gap-2">
          {#if card.due_date && formattedDueDate}
            {@const status = dueDateStatus}
            <span
              class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium {status === 'overdue'
                ? 'bg-red-50 text-red-600 font-semibold'
                : status === 'warning'
                  ? 'bg-amber-50 text-amber-700 font-semibold'
                  : 'text-slate-500 bg-slate-100'}"
            >
              {#if status === 'overdue'}
                <AlertTriangle class="h-3 w-3 text-red-600" />
              {:else if status === 'warning'}
                <Clock class="h-3 w-3 text-amber-600" />
              {:else}
                <Calendar class="h-3 w-3" />
              {/if}
              <span>{formattedDueDate}</span>
            </span>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
