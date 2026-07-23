import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Chatbot } from "../components/Chatbot";
import { PublicNav } from "../components/PublicNav";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import { clearSession, getStoredUser, roleLabels, setSession } from "../lib/auth";
import { money, shortDate } from "../lib/utils";

const statusMap = {
  APPROVED: ["Confirmada", "green"],
  PENDING: ["Em análise", "yellow"],
  CANCELLED: ["Cancelada", "red"],
};

export function TouristAccount() {
  const [user, setUser] = useState(getStoredUser);
  const [bookings, setBookings] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      api("/auth/me").then(({ user: current }) => {
        setUser(current);
        return current;
      }),
      api("/bookings/mine").then(setBookings),
      api("/farms?preference=sustainability").then((data) => setFarms(data.farms.slice(0, 3))),
    ])
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const upcoming = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status !== "CANCELLED" && new Date(booking.visitDate) >= new Date())
        .sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate))[0],
    [bookings],
  );

  if (!user) {
    return <AccountAuth onAuthenticated={setUser} />;
  }

  if (["MANAGER", "FARMER"].includes(user.role)) {
    return (
      <main className="min-h-screen bg-cream">
        <PublicNav />
        <section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-2xl place-items-center px-5 text-center">
          <div>
            <ShieldCheck className="mx-auto size-12 text-agro-600" />
            <p className="mt-5 text-xs font-bold uppercase tracking-[.2em] text-agro-600">{roleLabels[user.role]}</p>
            <h1 className="mt-3 font-display text-4xl">A sua conta pertence à equipa.</h1>
            <p className="mt-4 text-sm text-stone-600">Abra o espaço de gestão para continuar a operação da fazenda.</p>
            <Link to="/dashboard"><Button className="mt-7">Abrir gestão <ArrowRight className="size-4" /></Button></Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <PublicNav />
      <section className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <header className="flex flex-col justify-between gap-6 border-b border-black/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.24em] text-agro-600">Minha conta</p>
            <h1 className="mt-3 font-display text-4xl sm:text-6xl">Olá, {user.name.split(" ")[0]}.</h1>
            <p className="mt-3 text-sm text-stone-600">Consulte as suas visitas e descubra o próximo lugar para viver.</p>
          </div>
          <button
            onClick={() => { clearSession(); setUser(null); }}
            className="inline-flex items-center gap-2 self-start text-sm font-bold text-stone-500 transition hover:text-agro-800"
          >
            <LogOut className="size-4" /> Terminar sessão
          </button>
        </header>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center gap-2 text-sm font-semibold text-stone-500">
            <LoaderCircle className="size-5 animate-spin text-agro-500" /> A preparar a sua conta…
          </div>
        ) : (
          <>
            <section className="grid gap-px overflow-hidden border-b border-black/10 bg-black/10 sm:grid-cols-3">
              <AccountMetric label="Reservas" value={bookings.length} detail="Associadas ao seu email" />
              <AccountMetric
                label="Próxima visita"
                value={upcoming ? shortDate.format(new Date(upcoming.visitDate)) : "Por escolher"}
                detail={upcoming?.experience?.name || "Explore as experiências"}
              />
              <AccountMetric label="Perfil" value="Visitante" detail={user.email} />
            </section>

            <section className="mt-10 grid gap-10 lg:grid-cols-[1.25fr_.75fr]">
              <div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.2em] text-agro-600">As suas visitas</p>
                    <h2 className="mt-2 font-display text-3xl sm:text-4xl">Reservas</h2>
                  </div>
                  <Link to="/#experiencias" className="text-sm font-bold text-agro-600">Ver experiências</Link>
                </div>

                {bookings.length === 0 ? (
                  <div className="mt-6 border-y border-black/10 py-12">
                    <CalendarDays className="size-8 text-agro-500" />
                    <h3 className="mt-4 text-xl font-bold">Ainda não há reservas nesta conta.</h3>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-stone-600">Quando uma pré-reserva usar o email {user.email}, ela aparecerá aqui automaticamente.</p>
                    <Link to="/fazendas"><Button className="mt-6">Descobrir fazendas <ArrowRight className="size-4" /></Button></Link>
                  </div>
                ) : (
                  <div className="mt-6 divide-y divide-black/10 border-y border-black/10">
                    {bookings.map((booking) => {
                      const [label, tone] = statusMap[booking.status] || statusMap.PENDING;
                      return (
                        <article key={booking.id} className="grid gap-4 py-6 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-lg font-bold">{booking.experience.name}</h3>
                              <Badge tone={tone}>{label}</Badge>
                            </div>
                            <p className="mt-2 text-sm text-stone-500">{shortDate.format(new Date(booking.visitDate))} · {booking.guests} visitante(s) · {booking.experience.duration || "Duração a confirmar"}</p>
                          </div>
                          <p className="font-black">{money.format(Number(booking.totalAmount))}</p>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              <aside className="bg-agro-900 p-6 text-white sm:p-8">
                <Sparkles className="size-6 text-sun" />
                <p className="mt-5 text-xs font-bold uppercase tracking-[.2em] text-sun">Recomendado para si</p>
                <h2 className="mt-2 font-display text-3xl">Natureza com propósito.</h2>
                <div className="mt-7 divide-y divide-white/15 border-y border-white/15">
                  {farms.map((farm) => (
                    <Link key={farm.id} to={`/fazendas?focus=${farm.id}`} className="group block py-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">{farm.name}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-white/55"><MapPin className="size-3" /> {farm.location}</p>
                          <p className="mt-2 text-xs leading-relaxed text-white/70">{farm.recommendationReason}</p>
                        </div>
                        <ArrowRight className="mt-1 size-4 shrink-0 transition group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </aside>
            </section>
          </>
        )}
      </section>
      <Chatbot scope="tourist" />
    </main>
  );
}

function AccountMetric({ label, value, detail }) {
  return (
    <div className="bg-cream py-6 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-1 truncate text-xs text-stone-500">{detail}</p>
    </div>
  );
}

function AccountAuth({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "visitante@agrotur.ao",
    password: "Visitante@2026",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(email, password) {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setSession(data.token, data.user);
    onAuthenticated(data.user);
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "register") {
        await api("/auth/register", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }
      await login(form.email, form.password);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <main className="grid min-h-screen bg-cream lg:grid-cols-[.95fr_1.05fr]">
        <section className="relative min-h-[300px] overflow-hidden lg:min-h-screen">
          <img src="/images/agrotur-hero.jpg" alt="Paisagem rural verde ao amanhecer" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-agro-900/90 via-agro-900/25 to-transparent" />
          <Link to="/" className="absolute left-6 top-6 text-lg font-black text-white sm:left-10 sm:top-9">AGRO <span className="text-sun">TUR</span></Link>
          <div className="absolute bottom-8 left-6 max-w-xl text-white sm:bottom-12 sm:left-10">
            <p className="font-display text-4xl leading-tight sm:text-5xl">As suas próximas histórias, num só lugar.</p>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-12 sm:px-10">
          <form onSubmit={submit} className="w-full max-w-md">
          <span className="grid size-12 place-items-center rounded-full bg-agro-100 text-agro-800"><UserRound /></span>
          <p className="mt-7 text-xs font-bold uppercase tracking-[.22em] text-agro-600">Conta do visitante</p>
          <h1 className="mt-3 font-display text-4xl">{mode === "login" ? "Entre na sua conta." : "Crie a sua conta."}</h1>
          <p className="mt-3 text-sm text-stone-500">Acompanhe reservas e receba sugestões para a próxima visita.</p>

          <div className="mt-6 flex border-b border-black/10">
            {[
              ["login", "Entrar"],
              ["register", "Criar conta"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`border-b-2 px-4 py-3 text-sm font-bold transition ${mode === value ? "border-agro-500 text-agro-800" : "border-transparent text-stone-400"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <label className="mt-6 block">
              <span className="text-sm font-bold">Nome</span>
              <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border bg-white px-4 focus-within:ring-2 focus-within:ring-agro-500">
                <UserRound className="size-4 text-stone-400" />
                <input required name="name" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="min-w-0 flex-1 outline-none" />
              </div>
            </label>
          )}

          <label className={`${mode === "register" ? "mt-5" : "mt-6"} block`}>
            <span className="text-sm font-bold">Email</span>
            <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border bg-white px-4 focus-within:ring-2 focus-within:ring-agro-500">
              <Mail className="size-4 text-stone-400" />
              <input required name="email" autoComplete="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="min-w-0 flex-1 outline-none" />
            </div>
          </label>

          <label className="mt-5 block">
            <span className="text-sm font-bold">Palavra-passe</span>
            <input required minLength={8} name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-2 h-12 w-full rounded-xl border bg-white px-4 outline-none focus:ring-2 focus:ring-agro-500" />
          </label>

          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <Button className="mt-6 w-full" disabled={loading}>
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : mode === "login" ? <CheckCircle2 className="size-4" /> : null}
            {loading ? "A processar…" : mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
          <Link to="/dashboard" className="mt-5 block text-center text-xs font-bold text-stone-500">Acesso do gestor ou fazendeiro</Link>
          </form>
        </section>
      </main>
      <Chatbot scope="tourist" />
    </>
  );
}
