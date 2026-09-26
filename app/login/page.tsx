'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else window.location.href = '/';
    } catch {
      setError('No se pudo conectar con el servicio de autenticación.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-shell"><form className="auth-card" onSubmit={submit}>
    <div className="brand-mark">CP</div>
    <h1>CIBER PISTE</h1><p className="muted">Punto de venta</p>
    <label>Correo<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username" /></label>
    <label>Contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" /></label>
    {error && <div className="error">No se pudo iniciar sesión. Verifica tus datos.</div>}
    <button className="primary" disabled={loading}>{loading ? 'Entrando…' : 'Iniciar sesión'}</button>
  </form></main>;
}
