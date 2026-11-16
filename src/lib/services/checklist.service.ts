import { supabase } from '../supabase/client';
import type { ChecklistRow } from '../types/kanban.types';

export async function fetchChecklists(
  cardId: string
): Promise<{ data: ChecklistRow[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('card_checklists')
      .select('*')
      .eq('card_id', cardId)
      .order('position', { ascending: true });

    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat checklist';
    return { data: null, error: message };
  }
}

export async function createChecklistItem(
  cardId: string,
  title: string,
  position: number
): Promise<{ data: ChecklistRow | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('card_checklists')
      .insert({
        card_id: cardId,
        title: title.trim(),
        position,
        is_completed: false
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('Gagal menambah item checklist');
    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menambah item checklist';
    return { data: null, error: message };
  }
}

export async function toggleChecklistItem(
  id: string,
  is_completed: boolean
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('card_checklists')
      .update({ is_completed })
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengubah status checklist';
    return { error: message };
  }
}

export async function deleteChecklistItem(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('card_checklists')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus item checklist';
    return { error: message };
  }
}

