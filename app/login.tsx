'use client';

import { FormEvent, useState } from 'react';
import { createSupabaseBrowser } from '../lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const { error: authError } = await createSupabaseBrowser().auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message); else window.location.href = '/';
    setLoading(false);
  }

  return <main className="auth-shell"><form className="auth-card" onSubmit={handleSubmit}>
    <div className="brand">CIBER <span>PISTE</span><small>POS</small></div>
    <h1>Iniciar sesión</h1><p className="muted">Accede al punto de venta.</p>
    <label>Correo<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" /></label>
    <label>Contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" /></label>
    {error && <div className="error">{error}</div>}
    <button className="primary" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
  </form></main>;
}
