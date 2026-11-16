import { supabase } from '../supabase/client';
import type { BoardRow, KanbanBoard, KanbanColumn, KanbanCard, LabelRow } from '../types/kanban.types';

interface RawCard {
  id: string;
  list_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  card_labels?: {
    labels: LabelRow | null;
  }[];
}

interface RawList {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: string;
  cards?: RawCard[];
}

export async function fetchBoardDetails(
  boardId: string
): Promise<{ board: KanbanBoard | null; error: string | null }> {
  try {
    const { data: boardData, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .single();

    if (boardError || !boardData) throw boardError || new Error('Board tidak ditemukan');

    const { data: listsData, error: listsError } = await supabase
      .from('lists')
      .select('*, cards(*, card_labels(labels(*)))')
      .eq('board_id', boardId)
      .order('position', { ascending: true });

    if (listsError) throw listsError;

    const rawLists = (listsData as unknown as RawList[]) ?? [];

    const columns: KanbanColumn[] = rawLists.map((list) => {
      const sortedCards = [...(list.cards ?? [])].sort((a, b) => a.position - b.position);

      const items: KanbanCard[] = sortedCards.map((card) => {
        const labels: LabelRow[] = (card.card_labels ?? [])
          .map((cl) => cl.labels)
          .filter((l): l is LabelRow => l !== null);

        return {
          id: card.id,
          list_id: card.list_id,
          title: card.title,
          description: card.description,
          due_date: card.due_date,
          position: card.position,
          created_at: card.created_at,
          updated_at: card.updated_at,
          labels
        };
      });

      return {
        id: list.id,
        board_id: list.board_id,
        title: list.title,
        position: list.position,
        created_at: list.created_at,
        items
      };
    });

    const board: KanbanBoard = {
      ...(boardData as unknown as BoardRow),
      columns
    };

    return { board, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat detail board';
    return { board: null, error: message };
  }
}

export async function createList(
  boardId: string,
  title: string,
  position: number
): Promise<{ data: KanbanColumn | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('lists')
      .insert({
        board_id: boardId,
        title: title.trim(),
        position
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('Gagal membuat kolom');

    const newColumn: KanbanColumn = {
      ...data,
      items: []
    };

    return { data: newColumn, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membuat kolom';
    return { data: null, error: message };
  }
}

export async function updateList(
  id: string,
  updates: { title?: string; position?: number }
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('lists')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memperbarui kolom';
    return { error: message };
  }
}

export async function deleteList(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('lists')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus kolom';
    return { error: message };
  }
}

export async function reorderLists(
  orderedLists: { id: string; board_id: string; title: string; position: number }[]
): Promise<{ error: string | null }> {
  try {
    if (orderedLists.length === 0) return { error: null };

    const payload = orderedLists.map((item) => ({
      id: item.id,
      board_id: item.board_id,
      title: item.title,
      position: item.position
    }));

    const { error } = await supabase.from('lists').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengubah urutan kolom';
    return { error: message };
  }
}
