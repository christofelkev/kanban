import { supabase } from '../supabase/client';
import type { CardRow, CardUpdate, KanbanCard, LabelRow } from '../types/kanban.types';

export async function createCard(
  listId: string,
  title: string,
  position: number
): Promise<{ data: KanbanCard | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .insert({
        list_id: listId,
        title: title.trim(),
        position
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('Gagal membuat kartu');

    const newCard: KanbanCard = {
      ...(data as unknown as CardRow),
      labels: []
    };

    return { data: newCard, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membuat kartu';
    return { data: null, error: message };
  }
}

export async function updateCard(
  id: string,
  updates: Partial<CardUpdate>
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('cards')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memperbarui kartu';
    return { error: message };
  }
}

export async function deleteCard(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus kartu';
    return { error: message };
  }
}

export async function archiveCard(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('cards')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengarsipkan kartu';
    return { error: message };
  }
}

export async function updateCardsPositions(
  cardsToUpdate: { id: string; list_id: string; position: number; title: string }[]
): Promise<{ error: string | null }> {
  try {
    if (cardsToUpdate.length === 0) return { error: null };

    const payload = cardsToUpdate.map((c) => ({
      id: c.id,
      list_id: c.list_id,
      position: c.position,
      title: c.title
    }));

    const { error } = await supabase.from('cards').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memperbarui posisi kartu';
    return { error: message };
  }
}

export async function getLabels(
  userId: string
): Promise<{ data: LabelRow[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('labels')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat label';
    return { data: null, error: message };
  }
}

export async function createLabel(
  userId: string,
  name: string,
  color: string
): Promise<{ data: LabelRow | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('labels')
      .insert({ user_id: userId, name: name.trim(), color })
      .select()
      .single();

    if (error || !data) throw error || new Error('Gagal membuat label');
    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membuat label';
    return { data: null, error: message };
  }
}

export async function assignLabelToCard(
  cardId: string,
  labelId: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('card_labels')
      .insert({ card_id: cardId, label_id: labelId });

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menautkan label';
    return { error: message };
  }
}

export async function removeLabelFromCard(
  cardId: string,
  labelId: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('card_labels')
      .delete()
      .match({ card_id: cardId, label_id: labelId });

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus label';
    return { error: message };
  }
}
