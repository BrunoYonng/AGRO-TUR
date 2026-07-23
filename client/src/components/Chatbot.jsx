import {
  Armchair,
  Bot,
  Compass,
  Leaf,
  LoaderCircle,
  LocateFixed,
  MapPin,
  MapPinned,
  MessageCircle,
  Send,
  Sparkles,
  Tags,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "./ui/Button";

const modules = [
  {
    id: "discovery",
    label: "Descobrir",
    icon: Compass,
    intro: "Diga-me o que valoriza ou use a sua localização para eu recomendar as melhores fazendas.",
    suggestions: ["Quais fazendas estão perto de mim?", "Quero a opção mais económica", "Recomenda uma fazenda sustentável"],
  },
  {
    id: "general",
    label: "Geral",
    icon: Sparkles,
    intro: "Conte-me o que procura e combino interesses, data e disponibilidade.",
    suggestions: ["O que recomenda para este fim de semana?", "Somos 4 pessoas"],
  },
  {
    id: "map",
    label: "Mapa",
    icon: MapPinned,
    intro: "Posso explicar o território e abrir no mapa a horta, o lago, o curral ou outras áreas.",
    suggestions: ["Onde fica o lago?", "Mostra a horta no mapa", "Que áreas posso visitar?"],
  },
  {
    id: "sustainability",
    label: "Ecologia",
    icon: Leaf,
    intro: "Vamos explorar solo, água, biodiversidade e práticas sustentáveis da fazenda.",
    suggestions: ["Como cuidam do solo?", "Há atividades sobre biodiversidade?"],
  },
  {
    id: "offers",
    label: "Ofertas",
    icon: Tags,
    intro: "Comparo preços, vagas e duração para encontrar a opção com melhor valor.",
    suggestions: ["Qual é a opção mais económica?", "Melhor opção para 4 pessoas"],
  },
  {
    id: "leisure",
    label: "Lazer",
    icon: Armchair,
    intro: "Ajudo a escolher pelo conforto, ritmo, alimentação, crianças ou tempo disponível.",
    suggestions: ["Quero uma visita tranquila", "O que fazer com crianças?"],
  },
];

const welcome = {
  id: "welcome",
  role: "bot",
  text: "Olá! Escolha um tema ou conte-me o que gostaria de viver na fazenda.",
};

function getSessionId() {
  const existing = sessionStorage.getItem("agrotur_chat");
  if (existing) return existing;
  const created =
    globalThis.crypto?.randomUUID?.() ||
    `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem("agrotur_chat", created);
  return created;
}

function TypewriterText({ text, animate, onDone, onProgress }) {
  const [visible, setVisible] = useState(animate ? "" : text);
  const doneRef = useRef(onDone);
  const progressRef = useRef(onProgress);

  useEffect(() => {
    doneRef.current = onDone;
    progressRef.current = onProgress;
  });

  useEffect(() => {
    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(text);
      doneRef.current?.();
      return undefined;
    }

    let cancelled = false;
    let index = 0;
    let timer;

    const typeNext = () => {
      if (cancelled) return;
      const step = text.length > 420 ? 3 : text.length > 220 ? 2 : 1;
      index = Math.min(index + step, text.length);
      setVisible(text.slice(0, index));
      progressRef.current?.();

      if (index >= text.length) {
        doneRef.current?.();
        return;
      }

      const lastCharacter = text[index - 1];
      const delay = /[.!?]/.test(lastCharacter)
        ? 120
        : /[,;:]/.test(lastCharacter)
          ? 65
          : 14 + Math.random() * 16;
      timer = window.setTimeout(typeNext, delay);
    };

    timer = window.setTimeout(typeNext, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [animate, text]);

  return (
    <>
      <span aria-hidden="true">{visible}</span>
      <span className="sr-only">{text}</span>
      {animate && visible.length < text.length && (
        <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-middle opacity-55" />
      )}
    </>
  );
}

function BotMessage({ message, onTypingDone, onProgress }) {
  const [revealed, setRevealed] = useState(!message.animate);

  function finish() {
    setRevealed(true);
    onTypingDone?.(message);
  }

  return (
    <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm leading-relaxed shadow-sm">
      <TypewriterText
        text={message.text}
        animate={message.animate}
        onDone={finish}
        onProgress={onProgress}
      />
      {revealed && message.mapTargets?.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-black/5 pt-3">
          {message.mapTargets.map((target) => (
            <Link
              key={`${target.kind}-${target.id}`}
              to={target.mapUrl}
              className="flex items-center gap-2 rounded-xl bg-agro-50 px-3 py-2.5 font-bold text-agro-800 transition hover:bg-agro-100"
            >
              <MapPin className="size-4 shrink-0 text-agro-500" />
              <span className="min-w-0 flex-1 truncate">{target.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-agro-600">Ver no mapa</span>
            </Link>
          ))}
        </div>
      )}
      {revealed && message.farmRecommendations?.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-black/5 pt-3">
          {message.farmRecommendations.map((farm, index) => (
            <Link
              key={farm.id}
              to={farm.mapUrl}
              className="block rounded-xl bg-agro-50 px-3 py-2.5 transition hover:bg-agro-100"
            >
              <div className="flex items-start gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-agro-900 text-[10px] font-black text-white">{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-agro-900">{farm.name}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-stone-600">{farm.recommendationReason}</span>
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-agro-600">
                    {farm.distanceKm !== null ? `${farm.distanceKm.toFixed(1)} km · ` : ""}
                    desde {farm.startingPriceKz.toLocaleString("pt-AO")} Kz
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {revealed && message.provider && message.provider !== "local" && (
        <span className="mt-2 block text-[10px] font-bold uppercase tracking-wider opacity-40">
          Via {message.provider}
        </span>
      )}
    </div>
  );
}

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [activeModule, setActiveModule] = useState("discovery");
  const [messages, setMessages] = useState([welcome]);
  const [suggestions, setSuggestions] = useState(modules[0].suggestions);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const inputRef = useRef(null);
  const conversationRef = useRef(null);

  function scrollToLatest() {
    requestAnimationFrame(() => {
      const element = conversationRef.current;
      if (element) element.scrollTop = element.scrollHeight;
    });
  }

  useEffect(scrollToLatest, [loading, messages, open]);

  async function sendMessage(rawMessage, locationOverride = null) {
    const message = rawMessage.trim();
    if (!message || loading || typing) return;
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text: message },
    ]);
    setValue("");
    setLoading(true);
    setWhatsapp("");
    setSuggestions([]);

    try {
      const data = await api("/chatbot", {
        method: "POST",
        body: JSON.stringify({
          message,
          module: activeModule,
          sessionId: getSessionId(),
          location: locationOverride || location,
        }),
      });
      setTyping(true);
      setMessages((current) => [
        ...current,
        {
          id: `bot-${Date.now()}`,
          role: "bot",
          text: data.answer,
          provider: data.provider,
          mapTargets: data.mapTargets,
          farmRecommendations:
            activeModule === "discovery" || /\bfazenda/i.test(message)
              ? data.farmRecommendations
              : [],
          whatsappUrl: data.whatsappUrl,
          animate: true,
        },
      ]);
      setSuggestions(data.suggestions || modules.find((item) => item.id === activeModule)?.suggestions || []);
    } catch {
      setSuggestions(modules.find((item) => item.id === activeModule)?.suggestions || []);
      setTyping(true);
      setMessages((current) => [
        ...current,
        {
          id: `bot-error-${Date.now()}`,
          role: "bot",
          text: "A ligação está instável. Posso continuar pelo WhatsApp para preparar a sua visita.",
          whatsappUrl: `https://wa.me/244923000000?text=${encodeURIComponent(`Olá AGRO TUR! ${message}`)}`,
          animate: true,
        },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const consentedLocation = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        setLocation(consentedLocation);
        setLocationStatus("ready");
        sendMessage("Quais fazendas estão perto de mim?", consentedLocation);
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 300000 },
    );
  }

  function submit(event) {
    event.preventDefault();
    sendMessage(value);
  }

  function selectModule(selected) {
    if (selected.id === activeModule || loading || typing) return;
    setActiveModule(selected.id);
    setSuggestions(selected.suggestions);
    setWhatsapp("");
    setTyping(true);
    setMessages((current) => [
      ...current,
      {
        id: `module-${selected.id}-${Date.now()}`,
        role: "bot",
        text: selected.intro,
        animate: true,
      },
    ]);
  }

  function typingDone(message) {
    setTyping(false);
    if (message.whatsappUrl) setWhatsapp(message.whatsappUrl);
    scrollToLatest();
  }

  const selectedModule = modules.find((item) => item.id === activeModule);

  return (
    <div className="fixed bottom-5 right-5 z-[2000] sm:bottom-7 sm:right-7">
      {open && (
        <section className="mb-3 flex h-[min(680px,82vh)] w-[calc(100vw-40px)] flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl sm:w-[410px]">
          <div className="flex items-center gap-3 bg-agro-900 px-5 py-4 text-white">
            <span className="grid size-10 place-items-center rounded-full bg-white/10">
              <Bot className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold">Assistente AGRO TUR</h2>
              <p className="truncate text-xs text-white/65">{selectedModule?.label} · guia inteligente</p>
            </div>
            <button aria-label="Fechar chat" onClick={() => setOpen(false)}>
              <X />
            </button>
          </div>

          <div className="scrollbar-none flex gap-1.5 overflow-x-auto border-b bg-white px-3 py-2.5">
            {modules.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeModule;
              return (
                <button
                  key={item.id}
                  disabled={loading || typing}
                  onClick={() => selectModule(item)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition ${
                    active
                      ? "bg-agro-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-agro-50 hover:text-agro-800"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
          {activeModule === "discovery" && (
            <button
              type="button"
              disabled={loading || typing || locationStatus === "loading"}
              onClick={useMyLocation}
              className="flex items-center justify-center gap-2 border-b bg-agro-50 px-4 py-2.5 text-xs font-bold text-agro-800 transition hover:bg-agro-100 disabled:opacity-60"
            >
              <LocateFixed className={`size-4 ${locationStatus === "loading" ? "animate-pulse" : ""}`} />
              {locationStatus === "ready"
                ? "Localização ativa · atualizar recomendações"
                : locationStatus === "loading"
                  ? "A obter localização…"
                  : locationStatus === "denied"
                    ? "Sem permissão · tentar novamente"
                    : "Recomendar perto de mim"}
            </button>
          )}

          <div
            ref={conversationRef}
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto bg-stone-50 p-4"
          >
            {messages.map((message) =>
              message.role === "user" ? (
                <div
                  key={message.id}
                  className="ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-agro-500 px-4 py-3 text-sm leading-relaxed text-white"
                >
                  {message.text}
                </div>
              ) : (
                <BotMessage
                  key={message.id}
                  message={message}
                  onTypingDone={typingDone}
                  onProgress={scrollToLatest}
                />
              ),
            )}

            {loading && (
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
                <LoaderCircle className="size-4 animate-spin text-agro-500" />
                A consultar {selectedModule?.label.toLowerCase()}…
              </div>
            )}

            {!loading && !typing && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="rounded-full border border-agro-500/20 bg-white px-3 py-2 text-left text-xs font-semibold text-agro-800 transition hover:border-agro-500 hover:bg-agro-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {whatsapp && !typing && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl bg-[#25D366] px-4 py-3 text-center text-sm font-bold text-white"
              >
                Continuar pré-reserva no WhatsApp
              </a>
            )}
          </div>

          <form className="flex gap-2 border-t bg-white p-3" onSubmit={submit}>
            <input
              ref={inputRef}
              value={value}
              disabled={loading || typing}
              onChange={(event) => setValue(event.target.value)}
              placeholder={
                activeModule === "map"
                  ? "Ex.: Mostra-me o lago..."
                  : activeModule === "offers"
                    ? "Ex.: Somos 4, qual compensa?"
                    : "Escreva a sua pergunta..."
              }
              className="min-w-0 flex-1 rounded-full bg-stone-100 px-4 text-sm outline-none ring-agro-500 focus:ring-2 disabled:opacity-60"
            />
            <Button aria-label="Enviar" size="icon" disabled={loading || typing || !value.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </section>
      )}
      <Button
        aria-label={open ? "Fechar assistente" : "Abrir assistente"}
        size="icon"
        variant="yellow"
        className="ml-auto size-14 shadow-xl transition hover:scale-105"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <MessageCircle />}
      </Button>
    </div>
  );
}
