<script lang="ts">
  import type { KanbanCard, DueDateStatus } from '../../types/kanban.types';
  import { Calendar, Clock, AlertTriangle } from '@lucide/svelte';
  import { format, isPast, isToday, addHours } from 'date-fns';
  import { id as localeId } from 'date-fns/locale';

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
      return format(new Date(card.due_date), 'd MMM', { locale: localeId });
    } catch {
      return null;
    }
  });
</script>

<div
  role="button"
  tabindex="0"
  onclick={onClick}
  onkeydown={(e) => e.key === 'Enter' && onClick()}
  class="group relative flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-indigo-300 hover:shadow-md cursor-pointer select-none"
>
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

  <!-- Card Footer Info -->
  {#if card.due_date || card.description}
    <div class="mt-1 flex items-center justify-between text-xs text-slate-400">
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
