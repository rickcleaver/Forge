import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { parseQuickLog } from "@/lib/parse-quick-log";
import { useGym } from "@/lib/store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function speechCtor(): (new () => SpeechRec) | null {
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function QuickLogBar({
  sessionId,
  exerciseId,
  cardio,
}: {
  sessionId: string;
  exerciseId: string;
  cardio?: boolean;
}) {
  const quickLogSet = useGym((s) => s.quickLogSet);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);
  const canTalk = typeof window !== "undefined" && Boolean(speechCtor());

  useEffect(() => {
    return () => recRef.current?.stop();
  }, []);

  function apply(raw: string) {
    const parsed = parseQuickLog(raw);
    if (!parsed) {
      setError(cardio ? "Try “20 min”" : "Try 185 for 8");
      return;
    }
    const ok = quickLogSet(sessionId, exerciseId, parsed);
    if (!ok) {
      setError("Could not log that set.");
      return;
    }
    setText("");
    setError(null);
  }

  function listen() {
    const Ctor = speechCtor();
    if (!Ctor) {
      setError("Voice isn’t available in this browser.");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev) => {
      const said = ev.results[0]?.[0]?.transcript ?? "";
      setText(said);
      apply(said);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setError(null);
    setListening(true);
    rec.start();
  }

  return (
    <div className="mt-3">
      <form
        className="flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          apply(text);
        }}
      >
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          className="h-11 flex-1 font-mono text-sm"
          inputMode="text"
          autoCapitalize="off"
          autoCorrect="off"
          placeholder={cardio ? "20 min" : "185 for 8"}
          aria-label="Quick log this set"
        />
        {canTalk ? (
          <Button
            type="button"
            variant={listening ? "success" : "secondary"}
            size="icon"
            aria-label={listening ? "Stop listening" : "Log by voice"}
            onClick={listen}
          >
            {listening ? <Square className="size-4" /> : <Mic className="size-4" />}
          </Button>
        ) : null}
        <Button type="submit" variant="secondary">
          Log
        </Button>
      </form>
      <p className="mt-1 text-[11px] text-muted">
        {error ?? (listening ? "Listening…" : cardio ? "Type minutes. Voice works too." : "Type or say 185 for 8")}
      </p>
    </div>
  );
}
