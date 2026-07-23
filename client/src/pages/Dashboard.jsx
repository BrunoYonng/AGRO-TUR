import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Banknote, BedDouble, CalendarCheck, Check, Clock3, MapPinned, Package, Plus, ShieldX, Sprout, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminShell } from "../components/AdminShell";
import { LoginPanel } from "../components/LoginPanel";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import { canUseDashboard, clearSession, getStoredUser, roleLabels } from "../lib/auth";
import { demoBookings, demoExperiences } from "../lib/demo-data";
import { money, shortDate } from "../lib/utils";

const weeklyDemo = [
  { day: "seg", reservas: 5 }, { day: "ter", reservas: 8 }, { day: "qua", reservas: 6 },
  { day: "qui", reservas: 12 }, { day: "sex", reservas: 9 }, { day: "sáb", reservas: 16 }, { day: "dom", reservas: 11 },
];

const statusMap = {
  APPROVED: ["Confirmada", "green"],
  PENDING: ["Pendente", "yellow"],
  CANCELLED: ["Cancelada", "red"],
};

export function Dashboard() {
  const [authenticated, setAuthenticated] = useState(Boolean(localStorage.getItem("agrotur_token")));
  const [user, setUser] = useState(getStoredUser);
  const [bookings, setBookings] = useState(demoBookings);
  const [experiences, setExperiences] = useState(demoExperiences);
  const [weekly, setWeekly] = useState(weeklyDemo);
  const [summary, setSummary] = useState({ bookings: 28, revenue: 1284000, occupancy: 74, topProduct: "Café da Fazenda" });
  const [products, setProducts] = useState([
    { id: "p1", name: "Café da Fazenda 250g", sku: "CAF-250", stock: 42, unit: "pacote", price: 4800 },
    { id: "p2", name: "Mel Silvestre 500ml", sku: "MEL-500", stock: 18, unit: "frasco", price: 5500 },
    { id: "p3", name: "Cabaz da Horta", sku: "CAB-001", stock: 9, unit: "cabaz", price: 7500 },
  ]);
  const [areas, setAreas] = useState([]);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    if (!authenticated) return;
    api("/auth/me")
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => {
        clearSession();
        setAuthenticated(false);
        setUser(null);
      });
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated || !user) return;
    if (user.role === "MANAGER") {
      Promise.allSettled([
        api("/bookings?limit=10").then(setBookings),
        api("/dashboard/weekly").then(setWeekly),
        api("/dashboard/summary").then(setSummary),
      ]);
    }
    if (user.role === "FARMER") {
      Promise.allSettled([
        api("/experiences").then(setExperiences),
        api("/products").then(setProducts),
        api("/areas").then(setAreas),
      ]);
    }
  }, [authenticated, user?.role]);

  async function updateStatus(id, status) {
    if (user?.role !== "MANAGER") return;
    const previous = bookings;
    setBookings((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    try {
      await api(`/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    } catch {
      setBookings(previous);
    }
  }

  const kpis = useMemo(() => [
    { label: "Reservas este mês", value: summary.bookings, detail: "+12% vs. mês anterior", trend: "up", icon: CalendarCheck },
    { label: "Faturamento", value: money.format(summary.revenue), detail: "+8,4% vs. mês anterior", trend: "up", icon: Banknote },
    { label: "Ocupação", value: `${summary.occupancy}%`, detail: "Meta mensal: 80%", trend: "down", icon: BedDouble },
    { label: "Produto mais vendido", value: summary.topProduct, detail: "86 unidades no mês", trend: "up", icon: Package },
  ], [summary]);

  if (!authenticated) return <LoginPanel onLogin={(loggedUser) => { setUser(loggedUser); setAuthenticated(true); }} />;
  if (user && !canUseDashboard(user)) {
    return (
      <main className="grid min-h-screen place-items-center bg-cream px-5">
        <div className="max-w-md text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-sun/25 text-agro-900"><ShieldX /></span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-agro-600">{roleLabels[user.role]}</p>
          <h1 className="mt-3 font-display text-4xl">Esta área é da equipa da fazenda.</h1>
          <p className="mt-4 text-sm leading-relaxed text-stone-600">A sua conta de visitante continua válida para explorar fazendas e preparar reservas.</p>
          <Link to="/"><Button className="mt-7">Voltar às experiências</Button></Link>
        </div>
      </main>
    );
  }
  if (user?.role === "FARMER") {
    return (
      <FarmerDashboard
        user={user}
        experiences={experiences}
        products={products}
        areas={areas}
        modal={modal}
        setModal={setModal}
        setExperiences={setExperiences}
        setProducts={setProducts}
      />
    );
  }

  return (
    <AdminShell
      user={user}
      title="Visão executiva"
      subtitle={`Gestão · ${new Intl.DateTimeFormat("pt-AO", { month: "long", year: "numeric" }).format(new Date())}`}
    >
      <section id="financeiro" className="scroll-mt-6 grid gap-px overflow-hidden rounded-2xl border bg-black/10 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article key={kpi.label} className="bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-stone-500">{kpi.label}</p>
                <Icon className="size-4 text-agro-500" />
              </div>
              <p className="mt-4 min-h-8 text-2xl font-black tracking-tight">{kpi.value}</p>
              <p className={`mt-2 flex items-center gap-1 text-xs ${kpi.trend === "up" ? "text-agro-600" : "text-stone-500"}`}>
                {kpi.trend === "up" ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />} {kpi.detail}
              </p>
            </article>
          );
        })}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <article className="rounded-2xl bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div><h2 className="font-bold">Reservas por semana</h2><p className="mt-1 text-xs text-stone-500">Últimos 7 dias</p></div>
            <Badge>+18,2%</Badge>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly}>
                <defs>
                  <linearGradient id="chartGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4CAF50" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4CAF50" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#ecece6" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#78716c" }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#78716c" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 0, boxShadow: "0 10px 30px rgba(0,0,0,.12)" }} />
                <Area type="monotone" dataKey="reservas" stroke="#378a3b" strokeWidth={3} fill="url(#chartGreen)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="rounded-2xl bg-agro-900 p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-sun">Hoje na fazenda</p>
          <p className="mt-5 font-display text-4xl">{bookings.filter((item) => item.status === "APPROVED").length} grupos confirmados</p>
          <div className="mt-8 space-y-4 border-t border-white/15 pt-6">
            <div className="flex justify-between text-sm"><span className="text-white/60">Primeira chegada</span><strong>08:30</strong></div>
            <div className="flex justify-between text-sm"><span className="text-white/60">Visitantes previstos</span><strong>{bookings.reduce((sum, item) => sum + item.guests, 0)}</strong></div>
            <div className="flex justify-between text-sm"><span className="text-white/60">Próxima atividade</span><strong>Rota do Café</strong></div>
          </div>
        </article>
      </section>

      <section id="reservas" className="mt-6 overflow-hidden rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b px-5 py-5 sm:px-6">
          <div><h2 className="font-bold">Últimas reservas</h2><p className="mt-1 text-xs text-stone-500">Pedidos mais recentes e respetivo estado</p></div>
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Últimas 10</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
              <tr><th className="px-6 py-3">Visitante</th><th>Experiência</th><th>Data</th><th>Pessoas</th><th>Valor</th><th>Estado</th><th className="pr-6 text-right">Ações</th></tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((booking) => {
                const [label, tone] = statusMap[booking.status] || statusMap.PENDING;
                return (
                  <tr key={booking.id} className="transition hover:bg-agro-50/50">
                    <td className="px-6 py-4 font-bold">{booking.guestName}</td>
                    <td>{booking.experience?.name}</td>
                    <td>{shortDate.format(new Date(booking.visitDate))}</td>
                    <td>{booking.guests}</td>
                    <td className="font-semibold">{money.format(Number(booking.totalAmount))}</td>
                    <td><Badge tone={tone}>{label}</Badge></td>
                    <td className="pr-6 text-right">
                      {booking.status === "PENDING" ? (
                        <div className="flex justify-end gap-1">
                          <button title="Aprovar" onClick={() => updateStatus(booking.id, "APPROVED")} className="rounded-lg p-2 text-agro-600 hover:bg-agro-50"><Check className="size-4" /></button>
                          <button title="Cancelar" onClick={() => updateStatus(booking.id, "CANCELLED")} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><X className="size-4" /></button>
                        </div>
                      ) : <button className="text-xs font-bold text-stone-500">Detalhes</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

    </AdminShell>
  );
}

function FarmerDashboard({
  user,
  experiences,
  products,
  areas,
  modal,
  setModal,
  setExperiences,
  setProducts,
}) {
  const upcoming = [...experiences]
    .filter((experience) => new Date(experience.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextExperience = upcoming[0];
  const lowStock = products.filter((product) => product.stock < 10);
  const operationalMetrics = [
    { label: "Experiências ativas", value: experiences.length, detail: `${upcoming.length} com data futura`, icon: Sprout },
    { label: "Próxima atividade", value: nextExperience ? shortDate.format(new Date(nextExperience.date)) : "Sem agenda", detail: nextExperience?.name || "Cadastre uma experiência", icon: Clock3 },
    { label: "Estoque baixo", value: lowStock.length, detail: lowStock[0]?.name || "Nenhum produto crítico", icon: AlertTriangle },
    { label: "Áreas GIS", value: areas.length, detail: "Zonas mapeadas", icon: MapPinned },
  ];

  return (
    <AdminShell
      user={user}
      title="Operação da fazenda"
      subtitle="Agenda, catálogo, estoque e território"
      action={<Button size="sm" onClick={() => setModal("experience")}><Plus className="size-4" /> <span className="hidden sm:inline">Nova experiência</span></Button>}
    >
      <section className="grid gap-px overflow-hidden rounded-2xl border bg-black/10 sm:grid-cols-2 xl:grid-cols-4">
        {operationalMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-stone-500">{metric.label}</p>
                <Icon className="size-4 text-agro-500" />
              </div>
              <p className="mt-4 min-h-8 text-2xl font-black tracking-tight">{metric.value}</p>
              <p className="mt-2 truncate text-xs text-stone-500">{metric.detail}</p>
            </article>
          );
        })}
      </section>

      <section id="experiencias" className="scroll-mt-6 mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <ManagementList
          title="Experiências e atividades"
          description="Conteúdo publicado no catálogo turístico"
          items={experiences}
          onAdd={() => setModal("experience")}
          render={(item) => (
            <>
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="mt-1 text-xs text-stone-500">{shortDate.format(new Date(item.date))} · {item.capacity} vagas · {item.duration || "Duração por definir"}</p>
              </div>
              <p className="font-bold">{money.format(Number(item.price))}</p>
            </>
          )}
        />
        <article className="rounded-2xl bg-agro-900 p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-sun">Próximas atividades</p>
          <div className="mt-5 divide-y divide-white/15 border-y border-white/15">
            {upcoming.slice(0, 4).map((experience) => (
              <div key={experience.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-bold">{experience.name}</p>
                  <p className="mt-1 text-xs text-white/55">{shortDate.format(new Date(experience.date))}</p>
                </div>
                <Badge tone="yellow">{experience.capacity} vagas</Badge>
              </div>
            ))}
            {upcoming.length === 0 && <p className="py-6 text-sm text-white/60">Nenhuma atividade futura cadastrada.</p>}
          </div>
        </article>
      </section>

      <section id="produtos" className="scroll-mt-6 mt-6">
        <ManagementList
          title="Produtos e estoque"
          description="Inventário da loja da fazenda"
          items={products}
          onAdd={() => setModal("product")}
          render={(item) => (
            <>
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="mt-1 text-xs text-stone-500">{item.sku} · {money.format(Number(item.price))}</p>
              </div>
              <Badge tone={item.stock < 10 ? "red" : "green"}>{item.stock} {item.unit}</Badge>
            </>
          )}
        />
      </section>

      <section id="mapa-gis" className="scroll-mt-6 mt-6 overflow-hidden rounded-2xl bg-white">
        <div className="flex flex-col justify-between gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="font-bold">Mapa e áreas GIS</h2>
            <p className="mt-1 text-xs text-stone-500">Zonas de plantação, animais, lazer e serviço</p>
          </div>
          <Link to="/mapa?admin=1"><Button variant="outline" size="sm">Abrir editor GIS <ArrowRight className="size-4" /></Button></Link>
        </div>
        <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {areas.slice(0, 4).map((area) => (
            <div key={area.id} className="px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold">{area.name}</p>
                <Badge>{area.type}</Badge>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-stone-500">{area.description}</p>
            </div>
          ))}
          {areas.length === 0 && <p className="px-5 py-8 text-sm text-stone-500">Nenhuma área cadastrada.</p>}
        </div>
      </section>

      {modal && <QuickCreate type={modal} onClose={() => setModal(null)} onCreated={(item) => {
        if (modal === "experience") setExperiences((items) => [...items, item]);
        else setProducts((items) => [...items, item]);
        setModal(null);
      }} />}
    </AdminShell>
  );
}

function ManagementList({ title, description, items, onAdd, render }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white">
      <div className="flex items-center justify-between border-b px-5 py-5">
        <div><h2 className="font-bold">{title}</h2><p className="mt-1 text-xs text-stone-500">{description}</p></div>
        {onAdd && <Button variant="outline" size="sm" onClick={onAdd}><Plus className="size-4" /> Adicionar</Button>}
      </div>
      <div className="divide-y">
        {items.slice(0, 4).map((item) => <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">{render(item)}</div>)}
      </div>
    </article>
  );
}

function QuickCreate({ type, onClose, onCreated }) {
  const experience = type === "experience";
  const [form, setForm] = useState(experience
    ? { name: "", description: "", price: "", capacity: "", date: "", duration: "3h" }
    : { name: "", sku: "", price: "", stock: "", unit: "un" });
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const payload = experience ? { ...form, slug: `${form.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}` } : form;
    try {
      const item = await api(experience ? "/experiences" : "/products", { method: "POST", body: JSON.stringify(payload) });
      onCreated(item);
    } catch {
      onCreated({ ...payload, id: `local-${Date.now()}` });
    }
  }
  return (
    <div className="fixed inset-0 z-[4000] grid place-items-end bg-black/45 p-0 sm:place-items-center sm:p-5">
      <form onSubmit={submit} className="w-full max-w-lg rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px]">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Nova {experience ? "experiência" : "entrada de estoque"}</h2><button type="button" onClick={onClose}><X /></button></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Object.entries(form).map(([key, value]) => (
            <label key={key} className={key === "description" ? "sm:col-span-2" : ""}>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">{fieldLabel(key)}</span>
              {key === "description" ? (
                <textarea required value={value} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="min-h-24 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-agro-500" />
              ) : (
                <input required type={["price", "capacity", "stock"].includes(key) ? "number" : key === "date" ? "datetime-local" : "text"} value={value} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="h-11 w-full rounded-xl border px-3 outline-none focus:ring-2 focus:ring-agro-500" />
              )}
            </label>
          ))}
        </div>
        <Button className="mt-6 w-full" disabled={saving}>{saving ? "A guardar..." : "Guardar"}</Button>
      </form>
    </div>
  );
}

function fieldLabel(key) {
  return ({ name: "Nome", description: "Descrição", price: "Preço (Kz)", capacity: "Vagas", date: "Data", duration: "Duração", sku: "SKU", stock: "Quantidade", unit: "Unidade" })[key] || key;
}
