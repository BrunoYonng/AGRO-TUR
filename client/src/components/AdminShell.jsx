import { CalendarCheck, LayoutDashboard, LogOut, Map, Menu, Package, Sprout, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { clearSession, roleLabels } from "../lib/auth";

const items = [
  { label: "Visão geral", href: "/dashboard", icon: LayoutDashboard, roles: ["MANAGER", "FARMER"] },
  { label: "Reservas", href: "/dashboard#reservas", icon: CalendarCheck, roles: ["MANAGER", "FARMER"] },
  { label: "Experiências", href: "/dashboard#experiencias", icon: Sprout, roles: ["MANAGER", "FARMER"] },
  { label: "Produtos", href: "/dashboard#produtos", icon: Package, roles: ["MANAGER", "FARMER"] },
  { label: "Mapa GIS", href: "/mapa?admin=1", icon: Map, roles: ["MANAGER", "FARMER"] },
];

export function AdminShell({ children, title, subtitle, action, user }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const sidebar = (
    <aside className="flex h-full flex-col bg-agro-900 px-4 py-6 text-white">
      <Link to="/" className="flex items-center gap-2 px-3 text-lg font-black">AGRO <span className="text-sun">TUR</span></Link>
      <p className="px-3 pt-1 text-[10px] font-bold uppercase tracking-[.22em] text-white/40">Gestão da fazenda</p>
      <nav className="mt-10 space-y-1">
        {items.filter((item) => item.roles.includes(user?.role)).map((item) => {
          const Icon = item.icon;
          const active = item.href === "/dashboard" ? location.pathname === "/dashboard" && !location.hash : `${location.pathname}${location.search}` === item.href;
          return (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => setOpen(false)}
              className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white/65 transition hover:bg-white/10 hover:text-white", active && "bg-white/10 text-white")}
            >
              <Icon className="size-4" /> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4">
        <div className="mb-3 px-3">
          <p className="truncate text-sm font-bold">{user?.name}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[.18em] text-sun">{roleLabels[user?.role] || user?.role}</p>
        </div>
        <button
          onClick={() => { clearSession(); window.location.reload(); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-4" /> Terminar sessão
        </button>
      </div>
    </aside>
  );
  return (
    <div className="min-h-screen bg-[#f4f5f0] lg:grid lg:grid-cols-[250px_1fr]">
      <div className="hidden h-screen lg:sticky lg:top-0 lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-[3000] lg:hidden">
          <button aria-label="Fechar menu" className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative h-full w-[280px]">{sidebar}</div>
          <button className="absolute right-5 top-5 grid size-10 place-items-center rounded-full bg-white" onClick={() => setOpen(false)}><X /></button>
        </div>
      )}
      <main className="min-w-0">
        <header className="flex min-h-20 items-center gap-4 border-b border-black/5 bg-white px-5 sm:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)}><Menu /></button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold sm:text-2xl">{title}</h1>
            <p className="hidden text-sm text-stone-500 sm:block">{subtitle}</p>
          </div>
          {action}
        </header>
        <div className="p-5 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
