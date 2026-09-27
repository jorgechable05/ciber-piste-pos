'use client';

import { useMemo, useState } from 'react';
import {
  Barcode,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  LogIn,
  Package,
  Printer,
  RotateCcw,
  Search,
  ShoppingCart,
  Wallet,
  X,
} from 'lucide-react';

type Product = {
  id: number;
  name: string;
  code: string;
  section: string;
  price: number;
  stock: number;
};

type CartItem = Product & { quantity: number };
type Method = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
type Payment = { method: Method; amount: string };

const DEMO_PRODUCTS: Product[] = [
  { id: 1, name: 'Libreta profesional Norma', code: '750123456001', section: 'PAPELERÍA', price: 92, stock: 8 },
  { id: 2, name: 'Pluma azul punto fino', code: '750123456002', section: 'PAPELERÍA', price: 12, stock: 25 },
  { id: 3, name: 'Paleta Nestlé', code: '750123456003', section: 'PALETAS NESTLÉ', price: 10, stock: 30 },
  { id: 4, name: 'Refresco 600 ml', code: '750123456004', section: 'REFRESCOS', price: 22, stock: 18 },
  { id: 5, name: 'Pulsera juvenil', code: '750123456005', section: 'BISUTERÍA', price: 35, stock: 6 },
  { id: 6, name: 'Impresión B/N carta', code: '750123456006', section: 'SERVICIOS', price: 2, stock: 999 },
];

const sections = ['TODOS', 'PALETAS NESTLÉ', 'PAPELERÍA', 'BISUTERÍA', 'REFRESCOS', 'RTC', 'SERVICIOS'];

export default function DemoPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [active, setActive] = useState<'Dashboard' | 'POS' | 'Inventario' | 'Caja' | 'Devoluciones'>('POS');
  const [cashOpen, setCashOpen] = useState(false);
  const [opening, setOpening] = useState('500');
  const [term, setTerm] = useState('');
  const [section, setSection] = useState('TODOS');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([{ method: 'EFECTIVO', amount: '' }]);
  const [ticket, setTicket] = useState<{ folio: string; total: number; items: CartItem[] } | null>(null);
  const [lastReturn, setLastReturn] = useState('');
  const [closed, setClosed] = useState(false);
  const [demoSales, setDemoSales] = useState(1248.5);
  const [demoTickets, setDemoTickets] = useState(18);

  const filtered = useMemo(() => DEMO_PRODUCTS.filter((p) =>
    (section === 'TODOS' || p.section === section) &&
    `${p.name} ${p.code}`.toLowerCase().includes(term.toLowerCase())
  ), [term, section]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const paid = useMemo(() => payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0), [payments]);
  const cashPaid = useMemo(() => payments.filter((p) => p.method === 'EFECTIVO').reduce((sum, p) => sum + (Number(p.amount) || 0), 0), [payments]);
  const change = Math.max(0, cashPaid - total);

  function addProduct(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      return existing
        ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { ...product, quantity: 1 }];
    });
  }

  function removeProduct(id: number) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  function confirmDemoSale() {
    if (!cart.length || paid < total) return;
    const folio = `DEMO-${String(demoTickets + 1).padStart(5, '0')}`;
    setDemoSales((value) => value + total);
    setDemoTickets((value) => value + 1);
    setTicket({ folio, total, items: cart });
    setCart([]);
    setPayments([{ method: 'EFECTIVO', amount: '' }]);
    setShowPayment(false);
  }

  function printTicket() {
    if (!ticket) return;
    const popup = window.open('', '_blank', 'width=420,height=720');
    if (!popup) return;
    popup.document.write(`<html><head><title>${ticket.folio}</title><style>body{font-family:monospace;width:280px;margin:20px auto;font-size:12px}.center{text-align:center}.row{display:flex;justify-content:space-between}hr{border:0;border-top:1px dashed #000}</style></head><body><h2 class="center">CIBER PISTE</h2><div class="center">MODO DEMO · SIN VENTA REAL</div><hr>${ticket.items.map((i) => `<div>${i.quantity} x ${i.name}</div><div class="row"><span>$${i.price.toFixed(2)}</span><strong>$${(i.price * i.quantity).toFixed(2)}</strong></div>`).join('')}<hr><div class="row"><strong>TOTAL</strong><strong>$${ticket.total.toFixed(2)}</strong></div><p class="center">${ticket.folio}</p><script>window.onload=()=>window.print()</script></body></html>`);
    popup.document.close();
  }

  if (!loggedIn) {
    return (
      <main className="auth-shell" style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, #fff7cc, #f6f7fb 45%)' }}>
        <div className="auth-card" style={{ maxWidth: 460 }}>
          <div className="brand-mark" style={{ background: '#111827', margin: '0 auto' }}>CP</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: 999, background: '#fef3c7', color: '#92400e', fontWeight: 800, fontSize: 12 }}>MODO DEMO · SIN BASE REAL</div>
            <h1 style={{ margin: '14px 0 6px' }}>CIBER PISTE POS</h1>
            <p className="muted">Explora el sistema y prueba el flujo completo sin afectar ventas, inventario ni caja reales.</p>
          </div>
          <label>Usuario de demostración<input value="demo@ciberpiste.local" readOnly /></label>
          <label>Contraseña de demostración<input value="demo1234" readOnly /></label>
          <button className="primary" onClick={() => setLoggedIn(true)}><LogIn size={18} /> Entrar a la demostración</button>
          <p className="muted" style={{ textAlign: 'center', margin: 0 }}>Todos los datos de esta pantalla viven únicamente en el navegador.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="pos-shell">
      <aside className="sidebar">
        <div className="brand">CIBER <span>PISTE</span><small>POS · DEMO</small></div>
        <div style={{ margin: '0 10px', padding: '8px 10px', borderRadius: 10, background: '#92400e', color: '#fff', fontSize: 11, fontWeight: 800, textAlign: 'center' }}>ENTORNO DE PRUEBA</div>
        <nav>
          {([
            ['Dashboard', LayoutDashboard],
            ['POS', ShoppingCart],
            ['Inventario', Package],
            ['Caja', Wallet],
            ['Devoluciones', RotateCcw],
          ] as const).map(([name, Icon]) => (
            <button key={name} className={active === name ? 'nav active' : 'nav'} onClick={() => setActive(name)}><Icon size={20} />{name}</button>
          ))}
        </nav>
        <button className="nav logout" onClick={() => setLoggedIn(false)}><X size={20} />Salir demo</button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><strong>{active}</strong><span className="muted"> · demo@ciberpiste.local</span></div>
          <div className="status">● DEMO AISLADA</div>
        </header>

        <div className="pos-main">
          {active === 'Dashboard' && (
            <>
              <div className="page-title"><div><h1>¡Bienvenido a CIBER PISTE POS!</h1><p className="muted">Panel de demostración para conocer el sistema antes de producción.</p></div><div className="card" style={{ padding: '10px 14px' }}>Caja: <strong>{cashOpen ? 'ABIERTA' : 'CERRADA'}</strong></div></div>
              <section className="metric-grid">
                <div className="card"><div className="muted">Ventas de hoy</div><div className="kpi">${demoSales.toFixed(2)}</div></div>
                <div className="card"><div className="muted">Tickets</div><div className="kpi">{demoTickets}</div></div>
                <div className="card"><div className="muted">Inventario bajo</div><div className="kpi">3</div></div>
                <div className="card"><div className="muted">Pedidos sugeridos</div><div className="kpi">2</div></div>
              </section>
              <div className="card" style={{ marginTop: 18 }}><h2>Flujo para mostrar al cliente</h2><p className="muted">Login → caja → venta → pago sencillo/mixto → cambio → ticket → devolución → cierre.</p></div>
            </>
          )}

          {active === 'Caja' && (
            <div className="card" style={{ maxWidth: 650 }}>
              <h1>Caja de demostración</h1>
              <p className="muted">Esta caja es simulada. No crea sesiones en Supabase.</p>
              {!cashOpen ? <><label>Fondo inicial<input type="number" value={opening} onChange={(e) => setOpening(e.target.value)} /></label><button className="primary" style={{ marginTop: 14 }} onClick={() => setCashOpen(true)}><Wallet size={18} /> Abrir caja de prueba</button></> : <><div className="card" style={{ marginTop: 14, background: '#f0fdf4' }}><CheckCircle2 size={20} /> Caja abierta · Fondo ${Number(opening).toFixed(2)}</div><button className="nav" style={{ marginTop: 12 }} onClick={() => setClosed(true)}>{closed ? 'Cierre realizado' : 'Realizar cierre de prueba'}</button></>}
            </div>
          )}

          {active === 'Inventario' && (
            <><div className="page-title"><div><h1>Inventario demo</h1><p className="muted">Productos ficticios para practicar búsqueda y venta.</p></div></div><div className="card"><div className="scan-row"><Search size={22} /><input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Buscar producto o código..." /></div>{DEMO_PRODUCTS.map((p) => <div className="cart-row" key={p.id}><span><strong>{p.name}</strong><small>{p.section} · Código {p.code}</small></span><strong>${p.price.toFixed(2)} · Stock {p.stock}</strong></div>)}</div></>
          )}

          {active === 'Devoluciones' && (
            <div className="card" style={{ maxWidth: 700 }}><h1>Devoluciones demo</h1><p className="muted">Prueba el comportamiento de devolución sin modificar ventas reales.</p><div className="scan-row"><Search size={22} /><input placeholder="Folio de prueba, por ejemplo DEMO-00019" /></div><button className="primary" onClick={() => setLastReturn('DEV-DEMO-0001 · devolución simulada correctamente')}><RotateCcw size={18} /> Simular devolución</button>{lastReturn && <div className="card" style={{ marginTop: 16, background: '#f0fdf4' }}><CheckCircle2 size={18} /> {lastReturn}</div>}</div>
          )}

          {active === 'POS' && (
            <>
              <div className="page-title"><div><h1>Punto de venta</h1><p className="muted">Prueba el escáner, carrito, pagos, cambio y ticket.</p></div><div className="card" style={{ padding: '10px 14px' }}>Caja: <strong>{cashOpen ? 'ABIERTA' : 'ABRE CAJA'}</strong></div></div>
              {!cashOpen && <div className="card" style={{ marginBottom: 16, background: '#fffbeb' }}>Abre primero la <button className="nav" style={{ display: 'inline-flex', width: 'auto', padding: '4px 8px', color: '#92400e' }} onClick={() => setActive('Caja')}>caja de prueba</button>.</div>}
              <section className="sale-layout">
                <div className="card sale-panel">
                  <div className="scan-row"><Barcode size={24} /><input autoFocus value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Escanea o busca un producto demo..." /><button className="primary" onClick={() => undefined}><Search size={18} /> Buscar</button></div>
                  <div className="section-grid">{sections.map((s) => <button className="section-btn" key={s} onClick={() => setSection(s)} style={section === s ? { borderColor: '#111827', background: '#f3f4f6' } : undefined}>{s}</button>)}</div>
                  <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>{filtered.map((p) => <button className="product-row" key={p.id} onClick={() => addProduct(p)} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: 14, border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', textAlign: 'left' }}><span><strong>{p.name}</strong><small style={{ display: 'block', color: '#6b7280' }}>{p.section} · {p.code}</small></span><strong>${p.price.toFixed(2)}</strong></button>)}</div>
                  <div className="cart-list" style={{ marginTop: 18 }}>{cart.map((item) => <div className="cart-row" key={item.id}><span><strong>{item.name}</strong><small>{item.quantity} × ${item.price.toFixed(2)}</small></span><span><strong>${(item.quantity * item.price).toFixed(2)}</strong><button className="nav" style={{ width: 'auto', padding: 4, display: 'inline-flex', marginLeft: 8 }} onClick={() => removeProduct(item.id)}>×</button></span></div>)}{!cart.length && <div className="empty"><ShoppingCart size={42} /><h3>Carrito de prueba vacío</h3><p className="muted">Agrega productos para comenzar.</p></div>}</div>
                </div>
                <div className="card checkout"><h2>Resumen</h2><div className="summary"><span>Total</span><strong>${total.toFixed(2)}</strong></div><button className="pay" disabled={!cashOpen || !cart.length} onClick={() => { setPayments([{ method: 'EFECTIVO', amount: total.toFixed(2) }]); setShowPayment(true); }}><CreditCard size={20} /> Cobrar</button></div>
              </section>
            </>
          )}
        </div>
      </section>

      {showPayment && <div className="auth-shell" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)' }}><div className="auth-card"><h2>Cobro de demostración · ${total.toFixed(2)}</h2>{payments.map((p, index) => <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}><select value={p.method} onChange={(e) => setPayments((ps) => ps.map((x, i) => i === index ? { ...x, method: e.target.value as Method } : x))}><option>EFECTIVO</option><option>TARJETA</option><option>TRANSFERENCIA</option></select><input type="number" value={p.amount} onChange={(e) => setPayments((ps) => ps.map((x, i) => i === index ? { ...x, amount: e.target.value } : x))} placeholder="Importe" />{payments.length > 1 && <button className="nav" onClick={() => setPayments((ps) => ps.filter((_, i) => i !== index))}>×</button>}</div>)}<button className="nav" onClick={() => setPayments((ps) => [...ps, { method: 'TARJETA', amount: '' }])}>+ Agregar método · probar pago mixto</button><div className="total"><span>Pagado</span><strong>${paid.toFixed(2)}</strong></div>{cashPaid > 0 && <div className="total"><span>Cambio</span><strong>${change.toFixed(2)}</strong></div>}<button className="primary" disabled={paid < total} onClick={confirmDemoSale}><CheckCircle2 size={18} /> Confirmar cobro demo</button><button className="nav" onClick={() => setShowPayment(false)}>Cancelar</button></div></div>}

      {ticket && <div className="auth-shell" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)' }}><div className="auth-card"><h2>Ticket {ticket.folio}</h2><div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, fontFamily: 'monospace' }}>{ticket.items.map((item) => <div className="row" key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{item.quantity} × {item.name}</span><strong>${(item.quantity * item.price).toFixed(2)}</strong></div>)}<hr /><div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}><strong>TOTAL</strong><strong>${ticket.total.toFixed(2)}</strong></div></div><div style={{ display: 'flex', gap: 8 }}><button className="primary" onClick={printTicket}><Printer size={18} /> Imprimir</button><button className="nav" onClick={() => setTicket(null)}>Cerrar</button></div></div></div>}
    </main>
  );
}
