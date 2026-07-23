import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Brand } from "./Brand";
import { Button } from "./ui/Button";

export function PublicNav({ overlay = false }) {
  const [open, setOpen] = useState(false);
  const links = [
    ["Experiências", "/#experiencias"],
    ["Mapa", "/mapa"],
    ["A fazenda", "/#fazenda"],
  ];
  return (
    <header className={overlay ? "absolute inset-x-0 top-0 z-[1000] text-white" : "relative z-[1000] border-b border-black/5 bg-white"}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Brand light={overlay} className="text-xl" />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map(([label, href]) => (
            <NavLink key={label} to={href} className="text-sm font-semibold opacity-90 transition hover:opacity-60">
              {label}
            </NavLink>
          ))}
          <Link to="/dashboard"><Button variant={overlay ? "yellow" : "primary"} size="sm">Área da fazenda</Button></Link>
        </nav>
        <button aria-label="Abrir menu" className="grid size-11 place-items-center md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="mx-5 rounded-2xl bg-white p-5 text-ink shadow-soft md:hidden">
          {links.map(([label, href]) => (
            <Link key={label} to={href} onClick={() => setOpen(false)} className="block border-b border-black/5 py-3 font-semibold">{label}</Link>
          ))}
          <Link to="/dashboard" className="mt-4 block"><Button className="w-full">Área da fazenda</Button></Link>
        </div>
      )}
    </header>
  );
}
