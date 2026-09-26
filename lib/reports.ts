import { createSupabaseBrowser } from './supabase-browser';

export async function getInventoryStatus() {
  const { data, error } = await createSupabaseBrowser().from('v_inventory_status').select('*').order('nombre');
  if (error) throw error;
  return data ?? [];
}

export async function getRotation(days = 30) {
  const { data, error } = await createSupabaseBrowser().rpc('product_rotation', { p_days: days });
  if (error) throw error;
  return data ?? [];
}

export async function getPurchaseSuggestions(days = 30, coverageDays = 14) {
  const { data, error } = await createSupabaseBrowser().rpc('suggest_purchases', { p_days: days, p_coverage_days: coverageDays });
  if (error) throw error;
  return data ?? [];
}

export async function getDailySectionTotals(date = new Date()) {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const { data, error } = await createSupabaseBrowser().from('sales').select('id,total,fecha,estado,sale_details(producto_id,cantidad,subtotal,products(nombre,categoria_id,categories(nombre)))').eq('estado', 'PAGADA').gte('fecha', start.toISOString()).lt('fecha', end.toISOString());
  if (error) throw error;
  const totals: Record<string, number> = {};
  for (const sale of data ?? []) for (const line of sale.sale_details ?? []) { const section = line.products?.categories?.nombre ?? 'SIN SECCION'; totals[section] = (totals[section] ?? 0) + Number(line.subtotal ?? 0); }
  return totals;
}
