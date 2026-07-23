import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, Sprout, Tractor, UserRoundCog } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { api } from "../lib/api";
import { setSession } from "../lib/auth";
import { Button } from "./ui/Button";

const demoAccounts = [
  { label: "Gestor", email: "gestor@agrotur.ao", password: "Gestor@2026", icon: UserRoundCog },
  { label: "Fazendeiro", email: "fazendeiro@agrotur.ao", password: "Fazenda@2026", icon: Tractor },
];

export function LoginPanel({ onLogin }) {
  const [email, setEmail] = useState(demoAccounts[0].email);
  const [password, setPassword] = useState(demoAccounts[0].password);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      setSession(data.token, data.user);
      onLogin(data.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-cream lg:grid-cols-[1.1fr_.9fr]">
      <div className="relative hidden overflow-hidden lg:block">
        <img src="/images/agrotur-hero.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-agro-900/90 via-agro-900/15 to-transparent" />
        <div className="absolute bottom-12 left-12 max-w-lg text-white">
          <p className="font-display text-5xl leading-tight">A fazenda inteira, no mesmo lugar.</p>
          <p className="mt-4 text-white/70">Reservas, inventário, experiências e território em tempo real.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-12">
        <form onSubmit={submit} className="w-full max-w-md">
          <span className="grid size-12 place-items-center rounded-full bg-agro-100 text-agro-800"><Sprout /></span>
          <p className="mt-8 text-xs font-bold uppercase tracking-[.24em] text-agro-600">AGRO TUR · Equipa</p>
          <h1 className="mt-3 font-display text-4xl">Bem-vindo de volta.</h1>
          <p className="mt-3 text-sm text-stone-500">Entre como gestor ou fazendeiro. As permissões serão aplicadas automaticamente.</p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            {demoAccounts.map((account) => {
              const Icon = account.icon;
              const active = email === account.email;
              return (
                <button
                  key={account.label}
                  type="button"
                  onClick={() => { setEmail(account.email); setPassword(account.password); }}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-bold transition ${active ? "border-agro-500 bg-agro-50 text-agro-900" : "bg-white text-stone-500 hover:border-agro-300"}`}
                >
                  <Icon className="size-4" /> {account.label}
                </button>
              );
            })}
          </div>
          <label className="mt-8 block text-sm font-bold">Email</label>
          <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border bg-white px-4 focus-within:ring-2 focus-within:ring-agro-500">
            <Mail className="size-4 text-stone-400" />
            <input name="email" autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-w-0 flex-1 outline-none" />
          </div>
          <label className="mt-5 block text-sm font-bold">Palavra-passe</label>
          <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border bg-white px-4 focus-within:ring-2 focus-within:ring-agro-500">
            <LockKeyhole className="size-4 text-stone-400" />
            <input name="password" autoComplete="current-password" type={visible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="min-w-0 flex-1 outline-none" />
            <button type="button" aria-label="Mostrar palavra-passe" onClick={() => setVisible(!visible)}>{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <Button className="mt-6 w-full" disabled={loading}>
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : null} Entrar no dashboard
          </Button>
          <p className="mt-5 text-center text-xs text-stone-400">As credenciais de demonstração já estão preenchidas.</p>
          <Link to="/" className="mt-3 block text-center text-xs font-bold text-agro-600">Continuar como visitante</Link>
        </form>
      </div>
    </main>
  );
}
