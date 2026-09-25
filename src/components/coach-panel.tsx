import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, Volume2, VolumeX } from "lucide-react";
import { askForgeCoach } from "@/lib/coach-ai";
import { buildCoachSnapshot, localCoachAnswer } from "@/lib/coach";
import { canSpeak, speakText, speechCtor, startSpeech, stopSpeak, type SpeechRec } from "@/lib/speech";
import { useGym } from "@/lib/store";
import { cn, uid } from "@/lib/utils";
import { Button } from "./ui/button";

const PROMPTS = [
  "Should I deload?",
  "Is this stall normal?",
  "What should I eat around training?",
  "I slept like garbage",
  "No motivation today",
  "How are my main lifts trending?",
];

const THREAD_KEY = "forge-coach-thread";

type ChatMsg = { id: string; role: "you" | "coach"; text: string };

function loadThread(): ChatMsg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(THREAD_KEY) ?? "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((m): m is ChatMsg => {
        const row = m as ChatMsg;
        return (row.role === "you" || row.role === "coach") && typeof row.text === "string" && typeof row.id === "string";
      })
      .slice(-80);
  } catch {
    return [];
  }
}

export function CoachPanel() {
  const sessions = useGym((s) => s.sessions);
  const snap = useMemo(() => buildCoachSnapshot(sessions), [sessions]);
  const [question, setQuestion] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>(loadThread);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceOut, setVoiceOut] = useState(() => {
    try {
      return localStorage.getItem("forge-coach-speak") !== "off";
    } catch {
      return true;
    }
  });
  const recRef = useRef<SpeechRec | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const canTalk = typeof window !== "undefined" && Boolean(speechCtor());
  const speakerOn = typeof window !== "undefined" && canSpeak();
  const lastCoach = [...msgs].reverse().find((m) => m.role === "coach");

  useEffect(() => {
    return () => {
      recRef.current?.stop();
      stopSpeak();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(THREAD_KEY, JSON.stringify(msgs));
    } catch {
      /* ignore */
    }
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, busy]);

  function say(text: string) {
    if (!voiceOut || !speakerOn) return;
    setSpeaking(true);
    speakText(text);
    window.setTimeout(() => setSpeaking(false), Math.min(20000, text.length * 60));
  }

  function endSession() {
    recRef.current?.stop();
    stopSpeak();
    setListening(false);
    setSpeaking(false);
    setBusy(false);
    setQuestion("");
    setMsgs([]);
    try {
      localStorage.removeItem(THREAD_KEY);
    } catch {
      /* ignore */
    }
  }

  async function ask(q: string) {
    const text = q.trim();
    if (!text || busy) return;
    recRef.current?.stop();
    stopSpeak();
    setListening(false);
    setSpeaking(false);
    setQuestion("");
    const userMsg: ChatMsg = { id: uid(), role: "you", text };
    const history = [...msgs, userMsg];
    setMsgs(history);
    setBusy(true);
    const instant = localCoachAnswer(text, snap);
    const prior = history.slice(0, -1).map((m) => ({
      role: m.role === "you" ? ("user" as const) : ("assistant" as const),
      content: m.text,
    }));
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setMsgs((cur) => [...cur, { id: uid(), role: "coach", text: instant }]);
      say(instant);
      setBusy(false);
      return;
    }
    try {
      const result = await askForgeCoach({
        data: { question: text, snapshot: snap, history: prior },
      });
      const final = result.source === "ai" && result.answer ? result.answer : instant;
      setMsgs((cur) => [...cur, { id: uid(), role: "coach", text: final }]);
      say(final);
    } catch {
      setMsgs((cur) => [...cur, { id: uid(), role: "coach", text: instant }]);
      say(instant);
    } finally {
      setBusy(false);
    }
  }

  function listen() {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    stopSpeak();
    setSpeaking(false);
    const rec = startSpeech((said) => {
      setListening(false);
      void ask(said);
    });
    if (!rec) return;
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
  }

  return (
    <section className="flex min-h-[68dvh] flex-col">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">Coach</p>
          <h2 className="mt-1 font-display text-lg font-semibold">Chat</h2>
          <p className="mt-1 text-sm text-muted">Gym, food, sleep, or everyday questions. End session to start fresh.</p>
        </div>
        {msgs.length ? (
          <Button type="button" variant="secondary" className="shrink-0" onClick={endSession}>
            End session
          </Button>
        ) : null}
      </header>

      <div
        ref={scrollerRef}
        className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2"
      >
        {msgs.length === 0 ? (
          <div className="rounded-2xl bg-surface px-4 py-5 shadow-[var(--shadow-border)]">
            <p className="text-sm text-muted">
              {snap.sessionsTotal
                ? `${snap.sessionsTotal} sessions in the log. Ask about lifts — or anything else.`
                : "Import Strong/Hevy or finish a session, then ask."}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={busy}
                  onClick={() => void ask(p)}
                  className="rounded-full bg-surface-2 px-3 py-1.5 text-xs text-fg"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {msgs.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "you" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                m.role === "you"
                  ? "rounded-br-md bg-accent text-accent-fg"
                  : "rounded-bl-md bg-surface text-fg shadow-[var(--shadow-border)]",
              )}
            >
              <p className="font-mono text-[10px] tracking-wider uppercase opacity-70">
                {m.role === "you" ? "You" : "Forge"}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}

        {busy ? (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 text-sm text-muted shadow-[var(--shadow-border)]">
              Typing…
            </div>
          </div>
        ) : null}
      </div>

      <form
        className="sticky bottom-0 mt-2 flex gap-2 bg-bg pt-2 pb-1"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={listening ? "Listening…" : "Message Forge"}
          className="h-11 min-w-0 flex-1 rounded-full bg-surface px-4 text-sm text-fg shadow-[var(--shadow-border)]"
        />
        {canTalk ? (
          <Button
            type="button"
            variant={listening ? "success" : "secondary"}
            size="icon"
            aria-label={listening ? "Stop listening" : "Ask by voice"}
            onClick={listen}
            disabled={busy}
          >
            {listening ? <Square className="size-4" /> : <Mic className="size-4" />}
          </Button>
        ) : null}
        {speakerOn ? (
          <Button
            type="button"
            variant={voiceOut ? "secondary" : "ghost"}
            size="icon"
            aria-label={voiceOut ? "Mute coach voice" : "Unmute coach voice"}
            onClick={() => {
              const next = !voiceOut;
              setVoiceOut(next);
              try {
                localStorage.setItem("forge-coach-speak", next ? "on" : "off");
              } catch {
                /* ignore */
              }
              if (!next) {
                stopSpeak();
                setSpeaking(false);
              } else if (lastCoach) say(lastCoach.text);
            }}
          >
            {voiceOut ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </Button>
        ) : null}
        <Button type="submit" disabled={busy || !question.trim()}>
          {busy ? "…" : "Send"}
        </Button>
      </form>
      {speaking ? (
        <p className="mt-1 font-mono text-[10px] tracking-wider text-muted uppercase">Speaking…</p>
      ) : null}
    </section>
  );
}
