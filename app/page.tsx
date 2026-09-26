const sections = ['PALETAS NESTLÉ','PAPELERÍA','BISUTERÍA','REFRESCOS','RTC','SERVICIOS'];

export default function Home() {
  return <main className="pos-shell">
    <header className="pos-header"><div><strong>CIBER PISTE</strong><div className="muted" style={{color:'#cbd5e1'}}>POS V1</div></div><span>Panel principal</span></header>
    <div className="pos-main">
      <h1>Dashboard</h1>
      <p className="muted">Sistema POS independiente de THOP.</p>
      <section className="metric-grid">
        <div className="card"><div className="muted">Ventas de hoy</div><div className="kpi">$0.00</div></div>
        <div className="card"><div className="muted">Tickets</div><div className="kpi">0</div></div>
        <div className="card"><div className="muted">Inventario bajo</div><div className="kpi">0</div></div>
        <div className="card"><div className="muted">Pedidos sugeridos</div><div className="kpi">0</div></div>
      </section>
      <section className="card" style={{marginTop:20}}><h2>Secciones</h2><div className="section-grid">{sections.map(s=><button className="section-btn" key={s}>{s}</button>)}</div></section>
    </div>
  </main>;
}
