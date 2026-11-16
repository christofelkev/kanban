import { supabase } from '../supabase/client';
import type { CommentRow } from '../types/kanban.types';

export async function fetchComments(
  cardId: string
): Promise<{ data: CommentRow[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat komentar';
    return { data: null, error: message };
  }
}

export async function addComment(
  cardId: string,
  userId: string,
  content: string
): Promise<{ data: CommentRow | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        card_id: cardId,
        user_id: userId,
        content: content.trim()
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('Gagal menambahkan komentar');
    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menambahkan komentar';
    return { data: null, error: message };
  }
}

export async function deleteComment(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus komentar';
    return { error: message };
  }
}
