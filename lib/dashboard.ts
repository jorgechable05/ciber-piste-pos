import { createSupabaseBrowser } from './supabase-browser';

export type DashboardMetrics = {
  ventas_hoy: number;
  tickets_hoy: number;
  inventario_bajo: number;
  pedidos_sugeridos: number;
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase.rpc('pos_dashboard_metrics');
  if (error) throw error;
  return {
    ventas_hoy: Number(data?.ventas_hoy ?? 0),
    tickets_hoy: Number(data?.tickets_hoy ?? 0),
    inventario_bajo: Number(data?.inventario_bajo ?? 0),
    pedidos_sugeridos: Number(data?.pedidos_sugeridos ?? 0),
  };
}
