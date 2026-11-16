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

export async function restoreCard(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('cards')
      .update({ archived_at: null })
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memulihkan kartu';
    return { error: message };
  }
}

export async function fetchArchivedCards(
  boardId: string
): Promise<{ data: KanbanCard[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*, card_labels(labels(*)), lists!inner(board_id)')
      .eq('lists.board_id', boardId)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false });

    if (error) throw error;

    const cards: KanbanCard[] = (data ?? []).map((card: any) => {
      const labels: LabelRow[] = (card.card_labels ?? [])
        .map((cl: any) => cl.labels)
        .filter((l: any): l is LabelRow => l !== null);

      return {
        id: card.id,
        list_id: card.list_id,
        title: card.title,
        description: card.description,
        due_date: card.due_date,
        position: card.position,
        created_at: card.created_at,
        updated_at: card.updated_at,
        archived_at: card.archived_at,
        cover_color: card.cover_color,
        labels
      };
    });

    return { data: cards, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat kartu terarsip';
    return { data: null, error: message };
  }
}

export async function duplicateCard(
  card: KanbanCard,
  newPosition: number,
  copyPrefix = 'Copy of'
): Promise<{ data: KanbanCard | null; error: string | null }> {
  try {
    const { data: newCardData, error: cardError } = await supabase
      .from('cards')
      .insert({
        list_id: card.list_id,
        title: `${copyPrefix} ${card.title}`,
        description: card.description,
        due_date: card.due_date,
        position: newPosition,
        cover_color: card.cover_color
      })
      .select()
      .single();

    if (cardError || !newCardData) throw cardError || new Error('Gagal menduplikasi kartu');

    // Duplicate labels
    if (card.labels && card.labels.length > 0) {
      const labelInserts = card.labels.map((l) => ({
        card_id: newCardData.id,
        label_id: l.id
      }));
      await supabase.from('card_labels').insert(labelInserts);
    }

    // Duplicate checklists
    let duplicatedChecklists: any[] = [];
    if (card.checklists && card.checklists.length > 0) {
      const checklistInserts = card.checklists.map((c) => ({
        card_id: newCardData.id,
        title: c.title,
        is_completed: false,
        position: c.position
      }));
      const { data: clData } = await supabase
        .from('card_checklists')
        .insert(checklistInserts)
        .select();
      if (clData) duplicatedChecklists = clData;
    }

    const duplicatedCard: KanbanCard = {
      ...(newCardData as unknown as CardRow),
      labels: card.labels ? [...card.labels] : [],
      checklists: duplicatedChecklists
    };

    return { data: duplicatedCard, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menduplikasi kartu';
    return { data: null, error: message };
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
