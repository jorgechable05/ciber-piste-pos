'use client';

import { useState } from 'react';
import { Barcode, CreditCard, Package, ShoppingCart, Wallet, LayoutDashboard, Settings, LogOut } from 'lucide-react';

const sections = ['PALETAS NESTLÉ','PAPELERÍA','BISUTERÍA','REFRESCOS','RTC','SERVICIOS'];

export default function Home() {
  const [active, setActive] = useState('POS');
  return <main className="pos-shell">
    <aside className="sidebar">
      <div className="brand">CIBER <span>PISTE</span><small>POS</small></div>
      <nav>{[['Dashboard',LayoutDashboard],['POS',ShoppingCart],['Inventario',Package],['Caja',Wallet],['Configuración',Settings]].map(([name,Icon])=><button key={String(name)} className={active===name?'nav active':'nav'} onClick={()=>setActive(String(name))}><Icon size={20}/>{String(name)}</button>)}</nav>
      <button className="nav logout"><LogOut size={20}/>Cerrar sesión</button>
    </aside>
    <section className="workspace">
      <header className="topbar"><div><strong>{active}</strong><span className="muted"> · CIBER PISTE POS</span></div><div className="status">● Sistema en línea</div></header>
      <div className="pos-main">
        <div className="page-title"><div><h1>{active}</h1><p className="muted">Punto de venta independiente de THOP.</p></div><button className="primary"><ShoppingCart size={18}/> Nueva venta</button></div>
        <section className="metric-grid">
          <div className="card"><div className="muted">Ventas de hoy</div><div className="kpi">$0.00</div></div>
          <div className="card"><div className="muted">Tickets</div><div className="kpi">0</div></div>
          <div className="card"><div className="muted">Inventario bajo</div><div className="kpi">0</div></div>
          <div className="card"><div className="muted">Pedidos sugeridos</div><div className="kpi">0</div></div>
        </section>
        <section className="sale-layout">
          <div className="card sale-panel"><div className="scan-row"><Barcode size={24}/><input autoFocus placeholder="Escanea un código de barras o busca un producto..."/><button className="primary">Buscar</button></div><div className="section-grid">{sections.map(s=><button className="section-btn" key={s}>{s}</button>)}</div><div className="empty"><ShoppingCart size={42}/><h3>Carrito vacío</h3><p className="muted">Escanea un producto para comenzar la venta.</p></div></div>
          <div className="card checkout"><h2>Resumen</h2><div className="summary"><span>Subtotal</span><strong>$0.00</strong></div><div className="summary"><span>Descuento</span><strong>$0.00</strong></div><div className="total"><span>Total</span><strong>$0.00</strong></div><button className="pay"><CreditCard size={20}/> Cobrar</button></div>
        </section>
      </div>
    </section>
  </main>;
}
