"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Sign-in failed");
      window.location.assign("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in failed");
      setBusy(false);
    }
  }
  return <main className="loginPage">
    <section className="loginCard">
      <Link className="loginBrand" href="/"><span className="brandmark">TN</span><span><b>Triage247Ng</b><small>Secure administration portal</small></span></Link>
      <span className="portalEyebrow">Authorised personnel only</span>
      <h1>Administrator sign in</h1>
      <p>Use the administrator credentials configured securely for this deployment.</p>
      <form onSubmit={submit}>
        <label>Email address<input name="email" type="email" autoComplete="username" required maxLength={254} /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required minLength={12} maxLength={256} /></label>
        {error && <div className="formError" role="alert">{error}</div>}
        <button className="primary full" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"}</button>
      </form>
      <small>Sessions expire after eight hours. Five unsuccessful attempts temporarily lock sign-in from that network.</small>
      <Link className="backToSite" href="/">← Return to public website</Link>
    </section>
  </main>;
}
