'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck, UserCheck, UserX, Users, RefreshCw } from 'lucide-react';
import { createSupabaseBrowser } from '../../lib/supabase-browser';
import { assignUserRole, getManageableProfiles, getManageableRoles, setUserActive, type ManageableProfile, type ManageableRole } from '../../lib/admin';

export default function AdminPage() {
  const [profiles, setProfiles] = useState<ManageableProfile[]>([]);
  const [roles, setRoles] = useState<ManageableRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const [p, r] = await Promise.all([getManageableProfiles(), getManageableRoles()]);
      setProfiles(p); setRoles(r);
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cargar la administración'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function changeRole(userId: string, roleId: number) {
    setSaving(userId); setError(''); setOk('');
    try { await assignUserRole(userId, roleId); setOk('Rol actualizado correctamente.'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo asignar el rol'); }
    finally { setSaving(null); }
  }

  async function toggle(user: ManageableProfile) {
    setSaving(user.id); setError(''); setOk('');
    try { await setUserActive(user.id, !user.activo); setOk(user.activo ? 'Usuario desactivado.' : 'Usuario activado.'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cambiar el estado'); }
    finally { setSaving(null); }
  }

  async function back() { const supabase = createSupabaseBrowser(); await supabase.auth.getUser(); window.location.href = '/'; }

  return <main className="pos-shell">
    <aside className="sidebar">
      <div className="brand">CIBER <span>PISTE</span><small>POS</small></div>
      <div className="card" style={{ margin: 12, padding: 16 }}><ShieldCheck size={24}/><h3>Administración</h3><p className="muted">Dueño y Encargado</p></div>
      <button className="nav logout" onClick={back}><ArrowLeft size={20}/>Volver al POS</button>
    </aside>
    <section className="workspace">
      <header className="topbar"><div><strong>Usuarios y roles</strong><span className="muted"> · Jerarquía CIBER PISTE</span></div><button className="nav" onClick={()=>void load()}><RefreshCw size={17}/>Actualizar</button></header>
      <div className="pos-main">
        <div className="page-title"><div><h1>Equipo y permisos</h1><p className="muted">El Dueño controla todo. El Encargado administra la operación y puede asignar roles operativos a los empleados.</p></div></div>
        {error && <div className="error">{error}</div>}{ok && <div className="card" style={{ marginBottom: 16 }}>✓ {ok}</div>}
        <section className="metric-grid"><div className="card"><div className="muted">Usuarios</div><div className="kpi">{profiles.length}</div></div><div className="card"><div className="muted">Activos</div><div className="kpi">{profiles.filter(p=>p.activo).length}</div></div><div className="card"><div className="muted">Roles disponibles</div><div className="kpi">{roles.length}</div></div><div className="card"><div className="muted">Nivel</div><div className="kpi" style={{fontSize:20}}>RBAC + RLS</div></div></section>
        <div className="card"><div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}><Users size={22}/><h2 style={{margin:0}}>Empleados</h2></div>
          {loading ? <p className="muted">Cargando usuarios…</p> : profiles.length === 0 ? <div className="empty"><Users size={42}/><h3>Aún no hay perfiles creados</h3><p className="muted">Los usuarios de Supabase Auth deben tener su perfil asignado antes de aparecer aquí.</p></div> : <div style={{display:'grid',gap:10}}>{profiles.map(user => <div key={user.id} style={{display:'grid',gridTemplateColumns:'minmax(180px,1fr) 180px 110px auto',gap:12,alignItems:'center',padding:'14px 0',borderBottom:'1px solid rgba(0,0,0,.08)'}}><div><strong>{user.nombre}</strong><div className="muted" style={{fontSize:12}}>{user.telefono || 'Sin teléfono'}</div></div><select value={user.rol_id} disabled={saving===user.id} onChange={e=>void changeRole(user.id,Number(e.target.value))}>{roles.map(role=><option key={role.id} value={role.id}>{role.nombre}</option>)}</select><span>{user.activo ? '🟢 Activo' : '🔴 Inactivo'}</span><button className="nav" disabled={saving===user.id} onClick={()=>void toggle(user)}>{user.activo ? <><UserX size={17}/>Desactivar</> : <><UserCheck size={17}/>Activar</>}</button></div>)}</div>}
        </div>
        <div className="card" style={{marginTop:16}}><h2>Jerarquía</h2><div className="section-grid"><div><strong>👑 DUEÑO</strong><p className="muted">Control total, configuración, usuarios, roles, reportes y auditoría.</p></div><div><strong>👔 ENCARGADO</strong><p className="muted">Supervisa la papelería y asigna roles operativos a empleados.</p></div><div><strong>👤 EMPLEADOS</strong><p className="muted">Vendedor, Cajero y Almacén reciben únicamente los permisos de su función.</p></div></div></div>
      </div>
    </section>
  </main>;
}
