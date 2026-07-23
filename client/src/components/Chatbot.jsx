import { Bot, LoaderCircle, MessageCircle, Send, X } from "lucide-react";
import { useRef, useState } from "react";
import { api } from "../lib/api";
import { Button } from "./ui/Button";

const welcome = {
  role: "bot",
  text: "Olá! Posso sugerir experiências pela data, preço ou número de pessoas. O que gostaria de viver na fazenda?",
};

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([welcome]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const inputRef = useRef(null);

  async function submit(event) {
    event.preventDefault();
    const message = value.trim();
    if (!message || loading) return;
    setMessages((current) => [...current, { role: "user", text: message }]);
    setValue("");
    setLoading(true);
    try {
      const data = await api("/chatbot", {
        method: "POST",
        body: JSON.stringify({ message, sessionId: sessionStorage.getItem("agrotur_chat") || "web" }),
      });
      setMessages((current) => [...current, { role: "bot", text: data.answer }]);
      setWhatsapp(data.whatsappUrl);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "bot",
          text: "A ligação está instável. Posso continuar pelo WhatsApp para preparar a sua visita.",
        },
      ]);
      setWhatsapp(`https://wa.me/244923000000?text=${encodeURIComponent(`Olá AGRO TUR! ${message}`)}`);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[2000] sm:bottom-7 sm:right-7">
      {open && (
        <section className="mb-3 flex h-[min(560px,75vh)] w-[calc(100vw-40px)] flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl sm:w-[380px]">
          <div className="flex items-center gap-3 bg-agro-900 px-5 py-4 text-white">
            <span className="grid size-10 place-items-center rounded-full bg-white/10"><Bot className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold">Assistente AGRO TUR</h2>
              <p className="text-xs text-white/65">Disponibilidade e pré-reserva</p>
            </div>
            <button aria-label="Fechar chat" onClick={() => setOpen(false)}><X /></button>
          </div>
          <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto bg-stone-50 p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user" ? "ml-auto rounded-br-sm bg-agro-500 text-white" : "rounded-bl-sm bg-white shadow-sm"
                }`}
              >
                {message.text}
              </div>
            ))}
            {loading && <LoaderCircle className="size-5 animate-spin text-agro-500" />}
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noreferrer" className="block rounded-xl bg-[#25D366] px-4 py-3 text-center text-sm font-bold text-white">
                Continuar pré-reserva no WhatsApp
              </a>
            )}
          </div>
          <form className="flex gap-2 border-t bg-white p-3" onSubmit={submit}>
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Ex.: Somos 4 no sábado..."
              className="min-w-0 flex-1 rounded-full bg-stone-100 px-4 text-sm outline-none ring-agro-500 focus:ring-2"
            />
            <Button aria-label="Enviar" size="icon" disabled={loading}><Send className="size-4" /></Button>
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
