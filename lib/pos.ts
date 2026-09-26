import { createSupabaseBrowser } from './supabase-browser';
import type { PosPayment, PosItem } from './pos-types';

export async function findProducts(term: string) {
  const supabase = createSupabaseBrowser();
  const clean = term.trim();
  if (!clean) return [];
  const safe = clean.replace(/[%_]/g, '\\$&');
  const { data, error } = await supabase
    .from('products')
    .select('id,nombre,codigo_barras,precio_venta,activo')
    .eq('activo', true)
    .or(`codigo_barras.eq.${clean},nombre.ilike.%${safe}%`)
    .order('nombre')
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function createSale(items: PosItem[], payments: PosPayment[], cashSessionId?: number | null) {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase.rpc('create_pos_sale', {
    p_items: items.map((item) => ({ producto_id: item.producto_id, cantidad: item.cantidad, descuento: item.descuento })),
    p_payments: payments,
    p_cash_session_id: cashSessionId ?? null,
  });
  if (error) throw error;
  return data as number;
}
