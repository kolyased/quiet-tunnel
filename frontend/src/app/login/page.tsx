"use client";

import { FormEvent, useState } from "react";
import { KeyRound, LockKeyhole } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        cache: "no-store",
      });
      if (!response.ok) {
        setError(response.status === 429 ? "Слишком много попыток. Попробуйте позже." : "Не удалось войти. Проверьте пароль и настройки доступа.");
        setPassword("");
        return;
      }
      setPassword("");
      window.location.replace("/");
    } catch {
      setError("Сайт сейчас недоступен. Повторите попытку позже.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="site dark auth-page">
    <section className="auth-card" aria-labelledby="login-heading">
      <Link className="brand" href="/login" aria-label="Quiet Tunnel"><span className="mark"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2.5 35 11v18L20 37.5 5 29V11L20 2.5Z"/><path d="M13 27V16.5a7 7 0 0 1 14 0V27M17 27v-8a3 3 0 0 1 6 0v8M20 24v7"/></svg></span><span>quiet tunnel</span></Link>
      <span className="step">PERSONAL WARP CONFIGURATION TOOL</span>
      <h1 id="login-heading">Вход владельца</h1>
      <p>Персональный доступ к Quiet Tunnel.</p>
      <form onSubmit={submit}>
        <label htmlFor="owner-password">Пароль</label>
        <input id="owner-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={1024} autoFocus />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="primary" type="submit" disabled={busy || !password}><KeyRound size={17}/>{busy ? "Проверка…" : "Войти"}</button>
      </form>
      <p className="privacy-line"><LockKeyhole size={14}/>Сессия ограничена по времени и хранится в защищённой cookie.</p>
    </section>
  </main>;
}
