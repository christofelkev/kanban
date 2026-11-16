import { supabase } from '../supabase/client';
import type { BoardRow } from '../types/kanban.types';

export interface BoardWithStats extends BoardRow {
  lists?: {
    id: string;
    cards: { id: string }[];
  }[];
}

export async function getBoards(): Promise<{ data: BoardWithStats[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('boards')
      .select('*, lists(id, cards(id))')
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data as unknown as BoardWithStats[]) ?? [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat daftar board';
    return { data: null, error: message };
  }
}

export async function createBoard(
  userId: string,
  title: string,
  color: string = '#6366F1',
  createDefaultColumns: boolean = true
): Promise<{ data: BoardRow | null; error: string | null }> {
  try {
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .insert({
        user_id: userId,
        title: title.trim(),
        color,
        position: 0
      })
      .select()
      .single();

    if (boardError || !board) throw boardError || new Error('Gagal membuat board');

    if (createDefaultColumns) {
      const defaultLists = [
        { board_id: board.id, title: 'Todo', position: 0 },
        { board_id: board.id, title: 'In Progress', position: 1 },
        { board_id: board.id, title: 'Done', position: 2 }
      ];

      const { error: listsError } = await supabase.from('lists').insert(defaultLists);
      if (listsError) {
        console.warn('Gagal membuat kolom default:', listsError.message);
      }
    }

    return { data: board, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membuat board';
    return { data: null, error: message };
  }
}

export async function updateBoard(
  id: string,
  updates: { title?: string; color?: string }
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('boards')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memperbarui board';
    return { error: message };
  }
}

export async function deleteBoard(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus board';
    return { error: message };
  }
}
