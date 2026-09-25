import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SpotterSignIn } from "@/components/spotter-signin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getSpotterDesk,
  joinCoach,
  listChat,
  makeCoachInvite,
  publishWeek,
  pullCoachPlan,
  saveSpotterProfile,
  sendChat,
  sendClientPlan,
  type DeskClient,
  type DeskMessage,
} from "@/lib/spotter-api";
import {
  buildSpotterPack,
  copyText,
  planFromCoachText,
} from "@/lib/spotter";
import { useGym } from "@/lib/store";
import { formatVolume } from "@/lib/utils";
import { applyWaitingCoachPlan, CLIENT_PRIVACY, coachWeekText, pushWeekToCoach } from "@/lib/spotter-sync";

export const Route = createFileRoute("/spotter")({ component: SpotterPage });

function SpotterPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <main className="px-5 pt-6">
        <p className="text-sm text-muted">Opening Spotter…</p>
      </main>
    );
  }
  const realAccount = Boolean(user && !user.isDevFallback);
  return (
    <main className="px-5 pt-6 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Spotter</h1>
          <p className="mt-1 text-sm text-muted">Coach desk</p>
        </div>
        {realAccount ? <UserButton /> : null}
      </div>
      {realAccount ? null : <SpotterSignIn />}
      {user ? <Desk userId={user.id} name={user.displayName} /> : null}
    </main>
  );
}

function Desk({ userId, name }: { userId: string; name: string | null }) {
  const [handle, setHandle] = useState(name?.split(" ")[0] || "");
  const [role, setRole] = useState<"athlete" | "coach">("coach");
  const [ready, setReady] = useState(false);
  const [invite, setInvite] = useState<string | null>(null);
  const [clients, setClients] = useState<DeskClient[]>([]);
  const [coach, setCoach] = useState<{ coachId: string; handle: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    const desk = await getSpotterDesk();
    if (!desk.profile) {
      setReady(false);
      return;
    }
    setReady(true);
    setHandle(desk.profile.handle);
    setRole(desk.profile.role);
    setInvite(desk.invite);
    setClients(desk.clients);
    setCoach(desk.coach);
  }

  useEffect(() => {
    void refresh().catch((e) => setErr(e instanceof Error ? e.message : "Desk failed."));
  }, []);

  async function become(next: "athlete" | "coach" = role) {
    setErr(null);
    setRole(next);
    const saved = await saveSpotterProfile({ data: { handle, role: next } });
    if (saved.invite) setInvite(saved.invite);
    await refresh();
  }

  if (!ready) {
    return (
      <section className="mt-6">
        <p className="text-sm text-muted">Coaches tap I coach. Your 6-letter code shows on the next screen.</p>
        <Input className="mt-3" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="Name on the desk" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant={role === "athlete" ? "default" : "secondary"} onClick={() => setRole("athlete")}>
            I lift
          </Button>
          <Button variant={role === "coach" ? "default" : "secondary"} onClick={() => setRole("coach")}>
            I coach
          </Button>
        </div>
        <Button className="mt-4 w-full" onClick={() => void become()}>
          {role === "coach" ? "Show my coach code" : "Open athlete desk"}
        </Button>
        {err ? <p className="mt-3 text-sm text-danger">{err}</p> : null}
      </section>
    );
  }

  if (role === "coach") {
    return <CoachLive invite={invite} clients={clients} userId={userId} onRefresh={() => void refresh()} onSwitch={() => void become("athlete")} />;
  }
  return <AthleteLive coach={coach} userId={userId} onRefresh={() => void refresh()} onSwitch={() => void become("coach")} />;
}

function CoachLive({
  invite,
  clients,
  userId,
  onRefresh,
  onSwitch,
}: {
  invite: string | null;
  clients: DeskClient[];
  userId: string;
  onRefresh: () => void;
  onSwitch: () => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(clients[0]?.athleteId ?? null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "trained" | "quiet">("all");
  const [planText, setPlanText] = useState("Push\nBench 4x8\nOHP 3x8\n\nPull\nBarbell row 4x8\nPull-up 3x8\n\nLegs\nSquat 4x6\nRDL 3x8");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const active = clients.find((c) => c.athleteId === activeId) ?? null;

  function unreadDot(c: DeskClient) {
    if (!c.lastChatAt || c.lastMessage === userId) return false;
    try {
      const seen = Number(localStorage.getItem(`forge-chat-read:${c.athleteId}`) || 0);
      return c.lastChatAt > seen;
    } catch {
      return true;
    }
  }

  useEffect(() => {
    if (!active) return;
    try {
      localStorage.setItem(`forge-chat-read:${active.athleteId}`, String(Date.now()));
    } catch {
      /* ignore */
    }
  }, [active?.athleteId]);

  useEffect(() => {
    if (active && !activeId) setActiveId(active.athleteId);
  }, [active, activeId]);

  useEffect(() => {
    const t = window.setInterval(onRefresh, 15000);
    return () => window.clearInterval(t);
  }, [onRefresh]);

  async function mint() {
    const made = await makeCoachInvite();
    setMsg(`Code ${made.code}`);
    onRefresh();
  }

  async function sendPlan() {
    if (!active) return;
    setErr(null);
    try {
      const plan = planFromCoachText("Coach week", active.athleteId.slice(0, 6), "", planText);
      await sendClientPlan({ data: { athleteId: active.athleteId, payload: JSON.stringify(plan) } });
      setMsg(`Sent to ${active.handle}.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not send.");
    }
  }

  return (
    <section className="mt-6">
      <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Client join code</p>
        <p className="mt-1 font-display text-4xl font-semibold tracking-[0.28em]">{invite ?? "…"}</p>
        <p className="mt-2 text-sm text-muted">They type this in Spotter → I lift.</p>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" onClick={() => void mint()}>
            New code
          </Button>
          {invite ? (
            <Button variant="secondary" onClick={() => void copyText(invite)}>
              Copy
            </Button>
          ) : null}
        </div>
      </div>
      <button type="button" className="mt-3 text-xs text-muted" onClick={onSwitch}>
        Switch to athlete
      </button>

      {clients.length ? (
        <div className="mt-4">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a client" />
          <div className="mt-2 flex gap-2">
            {(["all", "trained", "quiet"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`h-9 rounded-full px-3 text-xs uppercase ${filter === f ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? `All ${clients.length}` : f === "trained" ? "Trained" : "Quiet"}
              </button>
            ))}
          </div>
          <ul className="mt-3 max-h-[28rem] overflow-y-auto">
            {clients
              .filter((c) => {
                if (query.trim() && !c.handle.toLowerCase().includes(query.trim().toLowerCase())) return false;
                if (filter === "trained") return Boolean(c.week?.sessions);
                if (filter === "quiet") return !c.week?.sessions;
                return true;
              })
              .map((c, i) => (
                <li key={c.athleteId} className="mb-1">
                  <button
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ${
                      c.athleteId === active?.athleteId ? "bg-accent text-accent-fg" : "bg-surface"
                    }`}
                    onClick={() => setActiveId(c.athleteId === activeId ? null : c.athleteId)}
                  >
                    <span className="grid size-9 place-items-center rounded-full bg-well text-sm font-semibold">
                      {c.handle.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {i + 1}. {c.handle}
                      </span>
                      <span className={`block text-xs ${c.athleteId === active?.athleteId ? "opacity-80" : "text-muted"}`}>
                        {c.week ? `${c.week.sessions} sessions this week` : "No week yet"}
                      </span>
                    </span>
                    {unreadDot(c) ? <span className="size-2 rounded-full bg-accent" /> : null}
                  </button>
                  {c.athleteId === active?.athleteId && c.week ? (
                    <ol className="mt-1 rounded-xl bg-well px-3 py-3">
                      {c.week.days.map((d) => (
                        <li key={d.at} className="mt-3 first:mt-0">
                          <p className="font-mono text-[10px] tracking-wider text-muted uppercase">
                            {format(d.at, "EEE d")} · {d.name}
                          </p>
                          {(d.lifts ?? []).length === 0 ? (
                            <p className="mt-1 text-sm text-muted">No working sets logged.</p>
                          ) : (
                            <ul className="mt-2 flex flex-col gap-2">
                              {(d.lifts ?? []).map((lift) => (
                                <li key={lift.name}>
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium">{lift.name}</p>
                                    <span
                                      className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase leading-none ${
                                        lift.call === "up"
                                          ? "bg-accent text-accent-fg"
                                          : lift.call === "down"
                                            ? "bg-danger/20 text-danger"
                                            : "bg-surface-2 text-muted"
                                      }`}
                                    >
                                      {lift.call === "up" ? "Up" : lift.call === "down" ? "Down" : "Hold"}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 font-mono text-xs text-muted">
                                    {lift.sets
                                      .map((s) => `${s.weight ?? "—"}×${s.reps ?? "—"}`)
                                      .join("  ·  ")}{" "}
                                    {c.week?.unit}
                                  </p>
                                  <p className="mt-0.5 text-xs text-muted">{lift.why}</p>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </li>
              ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">No clients yet. Send the code.</p>
      )}

      {active ? (
        <>
          <div className="mt-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">{active.handle}</p>
            {active.week ? (
              <>
                <p className="mt-1 font-display text-2xl font-semibold">
                  {active.week.sessions} sessions
                  <span className="text-lg text-muted"> · {formatVolume(active.week.volume, active.week.unit)}</span>
                </p>
                <ul className="mt-3 flex flex-col gap-1 text-sm">
                  {active.week.days.map((d) => (
                    <li key={d.at} className="flex justify-between gap-3">
                      <span className="truncate">
                        {format(d.at, "EEE d")} · {d.name}
                      </span>
                      <span className="font-mono text-xs text-muted">{d.sets} sets</span>
                    </li>
                  ))}
                </ul>
                {active.week.note ? <p className="mt-3 text-sm">{active.week.note}</p> : null}
                <Button
                  className="mt-3 w-full"
                  variant="secondary"
                  onClick={() => {
                    const text = coachWeekText({
                      handle: active.handle,
                      sessions: active.week!.sessions,
                      volume: active.week!.volume,
                      unit: active.week!.unit,
                      days: active.week!.days,
                      lifts: active.week!.lifts,
                      note: active.week!.note,
                    });
                    void copyText(text);
                    const blob = new Blob([text], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `forge-week-${active.handle}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setMsg("Week copied and saved as a text file.");
                  }}
                >
                  Export week
                </Button>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">They have not published a week yet.</p>
            )}
          </div>
          <h2 className="mt-6 font-display text-lg font-semibold">Next week</h2>
          <textarea
            className="mt-2 min-h-36 w-full rounded-xl bg-surface p-3 text-sm shadow-[var(--shadow-border)]"
            value={planText}
            onChange={(e) => setPlanText(e.target.value)}
            aria-label="Plan text"
          />
          <Button className="mt-3 w-full" onClick={() => void sendPlan()}>
            Send to {active.handle}
          </Button>
          <Chat coachId={userId} athleteId={active.athleteId} me={userId} />
        </>
      ) : null}
      {msg ? <p className="mt-3 text-sm text-accent">{msg}</p> : null}
      {err ? <p className="mt-3 text-sm text-danger">{err}</p> : null}
      <p className="mt-6 text-xs text-muted">{CLIENT_PRIVACY}</p>
      <button type="button" className="mt-2 text-xs text-accent" onClick={() => void copyText(CLIENT_PRIVACY)}>
        Copy privacy line for clients
      </button>
    </section>
  );
}

function AthleteLive({
  coach,
  userId,
  onRefresh,
  onSwitch,
}: {
  coach: { coachId: string; handle: string } | null;
  userId: string;
  onRefresh: () => void;
  onSwitch: () => void;
}) {
  const sessions = useGym((s) => s.sessions);
  const settings = useGym((s) => s.settings);
  const importProgramPack = useGym((s) => s.importProgramPack);
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  useEffect(() => {
    void applyWaitingCoachPlan()
      .then((name) => {
        if (name) setMsg(`${name} is on your week. Open Train to start a day.`);
      })
      .catch(() => null);
    void pushWeekToCoach().catch(() => null);
  }, []);
  const pack = useMemo(
    () => buildSpotterPack({ sessions, settings, handle: "Me", note }),
    [sessions, settings, note],
  );

  async function publish() {
    setErr(null);
    try {
      await publishWeek({ data: JSON.stringify(pack) });
      setMsg("Week is on your coach’s tab.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not publish.");
    }
  }

  async function join() {
    setErr(null);
    try {
      await joinCoach({ data: code });
      setMsg("Linked.");
      onRefresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not join.");
    }
  }

  async function takePlan() {
    try {
      const plan = await pullCoachPlan();
      if (!plan?.days.length) {
        setErr("No plan waiting.");
        return;
      }
      importProgramPack({
        name: plan.name,
        source: "Spotter",
        mapWeek: true,
        days: plan.days,
      });
      setMsg(`${plan.name} is on your week.`);
      setPlanOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not pull plan.");
    }
  }

  return (
    <section className="mt-6">
      {coach ? (
        <p className="text-sm text-muted">
          Linked to <span className="text-fg">{coach.handle}</span>
        </p>
      ) : (
        <>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coach code" />
          <Button className="mt-2 w-full" onClick={() => void join()}>
            Join coach
          </Button>
        </>
      )}

      <label className="mt-4 block text-sm text-muted">
        Note for coach
        <Input className="mt-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Shoulder felt tight" />
      </label>
      <div className="mt-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="font-mono text-[10px] tracking-wider text-muted uppercase">This week</p>
        <p className="mt-1 font-display text-2xl font-semibold">
          {pack.sessions} sessions
          <span className="text-lg text-muted"> · {formatVolume(pack.volume, pack.unit)}</span>
        </p>
      </div>
      <Button className="mt-4 w-full" onClick={() => void publish()}>
        Send week to coach
      </Button>
      <Button className="mt-2 w-full" variant="secondary" onClick={() => setPlanOpen(true)}>
        Pull coach plan
      </Button>
      {coach ? <Chat coachId={coach.coachId} athleteId={userId} me={userId} /> : null}
      <button type="button" className="mt-4 text-xs text-muted" onClick={onSwitch}>
        Switch to coach — show my code
      </button>
      <ConfirmDialog
        open={planOpen}
        title="Put this plan on your week?"
        body="It replaces the current week map with what your coach sent."
        confirmLabel="Apply plan"
        onClose={() => setPlanOpen(false)}
        onConfirm={() => void takePlan()}
      />
      {msg ? <p className="mt-3 text-sm text-accent">{msg}</p> : null}
      {err ? <p className="mt-3 text-sm text-danger">{err}</p> : null}
    </section>
  );
}

function Chat({ coachId, athleteId, me }: { coachId: string; athleteId: string; me: string }) {
  const [rows, setRows] = useState<DeskMessage[]>([]);
  const [draft, setDraft] = useState("");

  async function load() {
    const next = await listChat({ data: { coachId, athleteId } });
    setRows(next);
  }

  useEffect(() => {
    void load().catch(() => setRows([]));
    const t = window.setInterval(() => void load().catch(() => null), 8000);
    return () => window.clearInterval(t);
  }, [coachId, athleteId]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    await sendChat({ data: { coachId, athleteId, body } });
    await load();
  }

  return (
    <section className="mt-6">
      <h2 className="font-display text-lg font-semibold">Chat</h2>
      <ol className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
        {rows.length === 0 ? <li className="text-sm text-muted">No messages yet.</li> : null}
        {rows.map((m) => (
          <li
            key={m.id}
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              m.senderId === me ? "ml-auto bg-accent text-accent-fg" : "bg-surface shadow-[var(--shadow-border)]"
            }`}
          >
            {m.body}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message" />
        <Button onClick={() => void send()}>Send</Button>
      </div>
    </section>
  );
}
