"use client";

import { useState, useRef, useEffect } from "react";
import { CuteBananaMascot } from "./CuteBananaMascot";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Berapa omset batch aktif, Nana? 🍌",
  "Siapa pelanggan yang belum bayar? ⏳",
  "Berapa cup terjual dan laba sementara? 💰",
  "Kas toko aman buat belanja bahan? ✨",
];

export function AiChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Halo Kakak! 🍌✨ Aku Nana, personal assistant setia toko asinan Kakak. Mau Nana bantu rekapkan omset hari ini, pantau tagihan piutang, atau cek kas belanja? Tanya apa saja ya, Kak! 🌸",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, loading]);

  const sendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errJson?.error || `Gagal (${res.status})`);
      }

      const data = (await res.json()) as { reply?: string };
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Maaf, asisten AI tidak memberikan respons.",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${err instanceof Error ? err.message : "Terjadi kesalahan koneksi ke asisten AI."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2">
        {!isOpen && (
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#2D1B2D] shadow-md border border-pink-200 animate-pulse">
            <span>✨</span>
            <span>Tanya AI Asinan</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Buka Chat AI"
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 p-0.5 shadow-lg shadow-pink-500/25 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-white p-1">
            <CuteBananaMascot variant="advisor" size={38} />
          </div>
          <span className="absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white ring-2 ring-white">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
            <span className="absolute h-2 w-2 rounded-full bg-emerald-500" />
          </span>
        </button>
      </div>

      {/* Chat Window Dialog */}
      {isOpen && (
        <div className="fixed bottom-24 sm:bottom-22 right-4 sm:right-6 z-50 flex h-[520px] max-h-[80vh] w-[calc(100vw-2rem)] sm:w-96 flex-col overflow-hidden rounded-3xl border border-pink-200/90 bg-[#FFFDF9] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-pink-100 bg-white/80 px-4 py-3 backdrop-blur-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-pink-100 p-0.5 shadow-2xs">
                <CuteBananaMascot variant="advisor" size={32} />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#2D1B2D] flex items-center gap-1.5">
                  <span>Nana • Assistant 🍌✨</span>
                  <span className="rounded-full bg-pink-100 px-1.5 py-0.2 text-[9px] font-bold text-pink-700">
                    Cute &amp; Humble
                  </span>
                </h4>
                <p className="text-[10px] text-[#7A6273]">Siap sedia bantu urusan toko Kakak</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 text-pink-400 hover:bg-pink-100 hover:text-pink-600 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 bg-pink-50/20">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                    m.role === "user"
                      ? "rounded-tr-xs bg-gradient-to-r from-pink-500 to-rose-500 font-medium text-white"
                      : "rounded-tl-xs border border-pink-100 bg-white font-normal text-[#2D1B2D] whitespace-pre-line"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start">
                <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-pink-100 bg-white px-3.5 py-2.5 text-xs text-[#7A6273] shadow-2xs">
                  <span className="inline-block h-2 w-2 rounded-full bg-pink-400 animate-bounce" />
                  <span className="inline-block h-2 w-2 rounded-full bg-rose-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[10px] ml-1 font-semibold text-pink-600">
                    Nana lagi hitung buat Kakak... 🍌✨
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <div className="border-t border-pink-100 bg-white/70 px-3 py-2">
              <p className="text-[10px] font-bold text-[#7A6273] mb-1.5">Pertanyaan Cepat:</p>
              <div className="flex flex-wrap gap-1">
                {QUICK_PROMPTS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => void sendMessage(q)}
                    className="rounded-full border border-pink-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-pink-700 hover:bg-pink-50 hover:border-pink-300 transition-all cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
            className="border-t border-pink-100 bg-white p-3"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya Nana apa saja... (mis. cek piutang)"
                className="flex-1 rounded-full border border-pink-200 bg-[#FFFDF9] px-4 py-2 text-xs text-[#2D1B2D] placeholder:text-[#7A6273]/60 focus:border-pink-400 focus:outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                ➤
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
