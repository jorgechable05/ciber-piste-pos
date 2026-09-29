'use client';

import { FormEvent, useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || 'No se pudo iniciar sesión.');
        return;
      }
      window.location.replace('/');
    } catch {
      setError('No se pudo conectar con el servicio de autenticación.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={submit} autoComplete="on">
      <div className="brand-mark">CP</div>
      <h1>CIBER PISTE</h1>
      <p className="muted">Punto de venta</p>
      <label>Correo<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" /></label>
      <label>Contraseña<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label>
      {error && <div className="error" role="alert">{error}</div>}
      <button className="primary" disabled={loading}>{loading ? 'Entrando…' : 'Iniciar sesión'}</button>
    </form>
  );
}
