import { ArrowDown, ArrowRight, CalendarDays, Clock3, MapPinned, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Chatbot } from "../components/Chatbot";
import { PublicNav } from "../components/PublicNav";
import { Reveal } from "../components/Reveal";
import { Button } from "../components/ui/Button";
import { PublicMap } from "../components/PublicMap";
import { demoAreas, demoExperiences } from "../lib/demo-data";
import { money, shortDate } from "../lib/utils";

export function Home() {
  console.log("✓ Home renderizado com", demoExperiences.length, "experiências demo");

  const experiences = demoExperiences;
  const areas = demoAreas;

  return (
    <main className="overflow-hidden">
      <section className="relative min-h-[100svh] bg-agro-900 text-white">
        <img
          src="/images/agrotur-hero.jpg"
          alt="Fazenda entre montanhas e campos verdes ao amanhecer"
          fetchpriority="high"
          className="absolute inset-0 size-full object-cover object-[65%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-agro-900/95 via-agro-900/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-agro-900/55 via-transparent to-black/20" />
        <PublicNav overlay />
        <div className="relative mx-auto flex min-h-[100svh] max-w-7xl items-end px-5 pb-16 pt-28 sm:px-8 sm:pb-20 md:items-center md:pb-0">
          <div className="max-w-2xl">
            <p className="animate-rise text-xs font-bold uppercase tracking-[0.28em] text-sun">Agroturismo em Angola</p>
            <h1 className="mt-5 animate-rise font-display text-5xl font-semibold leading-[.96] tracking-tight [animation-delay:100ms] sm:text-7xl lg:text-8xl">
              A terra tem histórias para viver.
            </h1>
            <p className="mt-6 max-w-xl animate-rise text-base leading-relaxed text-white/80 [animation-delay:200ms] sm:text-lg">
              Dias feitos de natureza, sabores da fazenda e encontros que ficam na memória.
            </p>
            <div className="mt-8 flex animate-rise flex-wrap gap-3 [animation-delay:300ms]">
              <Link to="/fazendas"><Button variant="yellow">Descobrir fazendas <ArrowRight className="size-4" /></Button></Link>
              <Link to="/mapa"><Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">Ver mapa da fazenda</Button></Link>
            </div>
          </div>
          <a href="#experiencias" aria-label="Descer para experiências" className="absolute bottom-8 right-8 hidden size-12 place-items-center rounded-full border border-white/30 md:grid">
            <ArrowDown className="size-4 animate-bounce" />
          </a>
        </div>
      </section>

      <section id="experiencias" className="bg-cream py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="flex flex-col justify-between gap-5 border-b border-black/10 pb-9 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-agro-600">Próximas datas</p>
              <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight sm:text-6xl">Escolha como quer sentir a fazenda.</h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-stone-600">Grupos pequenos, anfitriões locais e atividades preparadas ao ritmo da natureza.</p>
          </Reveal>
          <div className="divide-y divide-black/10">
            {experiences.slice(0, 3).map((experience, index) => (
              <Reveal key={experience.id}>
                <article className="group grid gap-6 py-9 transition md:grid-cols-[100px_1fr_auto] md:items-center">
                  <div className="font-display text-4xl text-agro-900/25">{String(index + 1).padStart(2, "0")}</div>
                  <div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-stone-500">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4 text-agro-500" /> {shortDate.format(new Date(experience.date))}</span>
                      <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4 text-agro-500" /> {experience.duration || "3h"}</span>
                      <span className="inline-flex items-center gap-1.5"><Users className="size-4 text-agro-500" /> {experience.capacity} vagas</span>
                    </div>
                    <h3 className="mt-3 font-display text-3xl transition group-hover:text-agro-600 sm:text-4xl">{experience.name}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">{experience.description}</p>
                  </div>
                  <div className="flex items-center justify-between gap-5 md:block md:text-right">
                    <p className="text-lg font-black">{money.format(Number(experience.price))}</p>
                    <button onClick={() => document.querySelector('[aria-label="Abrir assistente"]')?.click()} className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-agro-600">
                      Reservar <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                    </button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="fazenda" className="grid bg-agro-900 text-white lg:grid-cols-2">
        <div className="relative min-h-[480px] overflow-hidden">
          <img src="/images/agrotur-hero.jpg" alt="" loading="lazy" className="absolute inset-0 size-full scale-125 object-cover object-right" />
          <div className="absolute inset-0 bg-agro-900/20" />
        </div>
        <Reveal className="flex items-center px-6 py-16 sm:px-14 lg:px-20">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-sun">Do campo à mesa</p>
            <h2 className="mt-4 font-display text-4xl leading-tight sm:text-6xl">Mais perto da origem, tudo sabe melhor.</h2>
            <p className="mt-6 leading-relaxed text-white/70">Conheça quem cultiva, participe da colheita e termine o dia à mesa com ingredientes que percorreram poucos metros.</p>
            <div className="mt-10 grid grid-cols-3 border-y border-white/15 py-6 text-center">
              <div><strong className="block text-2xl text-sun">4</strong><span className="text-xs text-white/60">áreas visitáveis</span></div>
              <div className="border-x border-white/15"><strong className="block text-2xl text-sun">12</strong><span className="text-xs text-white/60">produtos locais</span></div>
              <div><strong className="block text-2xl text-sun">100%</strong><span className="text-xs text-white/60">feito aqui</span></div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-agro-600">Explore antes de chegar</p>
              <h2 className="mt-3 font-display text-4xl sm:text-6xl">Um mapa vivo da fazenda.</h2>
            </div>
            <Link to="/mapa"><Button variant="outline"><MapPinned className="size-4" /> Abrir mapa completo</Button></Link>
          </Reveal>
          <Reveal className="overflow-hidden rounded-[28px] shadow-soft">
            <PublicMap areas={areas} compact />
          </Reveal>
        </div>
      </section>

      <footer className="bg-agro-900 px-5 py-14 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-2xl font-black">AGRO <span className="text-sun">TUR</span></p>
            <p className="mt-3 max-w-sm text-sm text-white/60">Aproximamos pessoas da terra, dos sabores e de quem os produz.</p>
          </div>
          <p className="text-xs text-white/45">© {new Date().getFullYear()} AGRO TUR · Feito em Angola</p>
        </div>
      </footer>
      <Chatbot />
    </main>
  );
}
