import { addDays, startOfWeek } from "date-fns";
import { e1rmHistory, sessionVolume, weekTraining } from "./stats";
import type { Program, Session, Settings, TrainGoal } from "./types";
import { planKind, planLabel, todayPlan } from "./week-plan";

export type LiftTrend = {
  name: string;
  latest: number | null;
  prev: number | null;
  changePct: number | null;
  weeksFlat: number;
};

export type CoachSnapshot = {
  sessionsTotal: number;
  weeksLogged: number;
  thisWeekSessions: number;
  thisWeekVolume: number;
  lastWeekVolume: number;
  volumeChangePct: number | null;
  daysTrainedThisWeek: number;
  hardWeeks: number;
  lifts: LiftTrend[];
  note: string;
  /** Optional player card for personalized Coach replies. */
  athlete?: {
    name: string | null;
    age: number | null;
    heightCm: number | null;
    weightLb: number | null;
    goal?: TrainGoal | null;
  };
  /** Today's slot from settings.weekPlan — Coach respects the board. */
  todayPlanLabel?: string | null;
  todayPlanKind?: "rest" | "template" | "program" | "blank";
};

function weekVolume(sessions: Session[], weekStart: number, weekEnd: number): number {
  return sessions
    .filter((s) => s.finishedAt && s.finishedAt >= weekStart && s.finishedAt < weekEnd)
    .reduce((n, s) => n + sessionVolume(s), 0);
}

export function buildCoachSnapshot(
  sessions: Session[],
  now = Date.now(),
  athlete?: CoachSnapshot["athlete"],
  weekPlan?: Settings["weekPlan"] | null,
  programs: Program[] = [],
): CoachSnapshot {
  const finished = sessions.filter((s) => s.finishedAt);
  const thisWeek = weekTraining(finished, now);
  const start = startOfWeek(now, { weekStartsOn: 1 }).getTime();
  const lastStart = addDays(start, -7).getTime();
  const thisVol = thisWeek.volume;
  const lastVol = weekVolume(finished, lastStart, start);
  const volumeChangePct =
    lastVol > 0 ? Math.round(((thisVol - lastVol) / lastVol) * 100) : null;

  let hardWeeks = 0;
  for (let i = 0; i < 6; i++) {
    const a = addDays(start, -7 * i).getTime();
    const b = addDays(a, 7).getTime();
    const days = new Set(
      finished
        .filter((s) => s.finishedAt && s.finishedAt >= a && s.finishedAt < b)
        .map((s) => new Date(s.finishedAt!).toDateString()),
    );
    if (days.size >= 5) hardWeeks += 1;
    else break;
  }

  const names = new Set<string>();
  for (const s of finished.slice(0, 40)) {
    for (const ex of s.exercises) names.add(ex.name);
  }
  const lifts: LiftTrend[] = [...names].slice(0, 12).map((name) => {
    const hist = e1rmHistory(finished, { name });
    const latest = hist.at(-1)?.e1rm ?? null;
    const prev = hist.length >= 2 ? hist[hist.length - 2].e1rm : null;
    const changePct =
      latest != null && prev != null && prev > 0 ? Math.round(((latest - prev) / prev) * 100) : null;
    let weeksFlat = 0;
    if (hist.length >= 2) {
      const last = hist[hist.length - 1];
      for (let i = hist.length - 2; i >= 0; i--) {
        if (Math.abs(hist[i].e1rm - last.e1rm) <= Math.max(5, last.e1rm * 0.02)) weeksFlat += 1;
        else break;
      }
    }
    return { name, latest, prev, changePct, weeksFlat };
  });
  lifts.sort((a, b) => (b.latest ?? 0) - (a.latest ?? 0));

  const first = finished.at(-1)?.finishedAt ?? now;
  const weeksLogged = Math.max(1, Math.round((now - first) / (7 * 86_400_000)));

  const plan = todayPlan(weekPlan, now);
  const kind = planKind(plan);
  const todayPlanLabel = planLabel(plan, programs);

  return {
    sessionsTotal: finished.length,
    weeksLogged,
    thisWeekSessions: thisWeek.sessions,
    thisWeekVolume: thisVol,
    lastWeekVolume: lastVol,
    volumeChangePct,
    daysTrainedThisWeek: thisWeek.days.filter((d) => d.trained).length,
    hardWeeks,
    lifts: lifts.filter((l) => l.latest != null).slice(0, 8),
    note: "",
    athlete,
    todayPlanLabel,
    todayPlanKind: kind,
  };
}

function athleteWho(snap: CoachSnapshot): string | null {
  return snap.athlete?.name?.trim() || null;
}

function athleteGoalBit(snap: CoachSnapshot): string | null {
  const g = snap.athlete?.goal;
  if (!g) return null;
  switch (g) {
    case "muscle":
      return "building muscle";
    case "strength":
      return "getting stronger";
    case "fat":
      return "losing fat";
    case "fitness":
      return "getting fitter";
    case "recomp":
      return "recomp";
    default:
      return null;
  }
}

function athleteBodyBit(snap: CoachSnapshot): string | null {
  const a = snap.athlete;
  if (!a) return null;
  const bits: string[] = [];
  if (a.age != null) bits.push(`${a.age}`);
  if (a.heightCm != null && a.weightLb != null) {
    bits.push(`${Math.round(a.heightCm)}cm / ${Math.round(a.weightLb)}lb`);
  } else if (a.weightLb != null) {
    bits.push(`${Math.round(a.weightLb)}lb`);
  }
  return bits.length ? bits.join(", ") : null;
}

export function localCoachAnswer(question: string, snap: CoachSnapshot): string {
  const q = question.toLowerCase();
  const stall = snap.lifts.filter((l) => l.weeksFlat >= 3);
  const drop = (snap.volumeChangePct ?? 0) <= -25;
  const deload = snap.hardWeeks >= 3 || drop;

  if (/deload|rest week|take a week/.test(q)) {
    if (snap.sessionsTotal < 6) {
      return "Not yet. You don’t have enough logged weeks to call this fatigue. Keep training, keep the log honest. A deload is for when the work has been hard for a while — not for a quiet week.";
    }
    if (deload) {
      return `Yes — a light week makes sense. You’ve stacked ${snap.hardWeeks || "several"} hard week${snap.hardWeeks === 1 ? "" : "s"} and volume is ${snap.volumeChangePct ?? 0}% vs last week. Cut loads to about 70%, keep the same lifts, leave a couple reps in the tank. This is planned, not quitting.`;
    }
    return `You can keep going. Volume is ${snap.volumeChangePct == null ? "still building" : `${snap.volumeChangePct}% vs last week`} and you’re not in a long grind. If joints feel beat up, take the extra rest between sets — that’s enough. Save a full deload for after 3–5 hard weeks.`;
  }

  if (/normal|stall|plateau|stuck|not progressing|fail/.test(q)) {
    if (stall.length) {
      const names = stall.slice(0, 3).map((l) => l.name).join(", ");
      return `Yes. Flat strength on ${names} for a few weeks is normal. The body adapts in waves, not every session. Add a rep before you add weight, or hold the load and clean up form. A stall is not a broken streak. It’s the work landing.`;
    }
    if (snap.sessionsTotal < 8) {
      return "Too early to judge progress. The first month is the log learning you. Show up, write the sets down, don’t hunt PRs every day. That’s the normal path.";
    }
    return "What you have logged looks like training, not failure. Strength moves in steps. Quiet weeks after a PR are common. Keep the same program unless something hurts.";
  }

  if (/tomorrow|today|what should/.test(q)) {
    const who = athleteWho(snap);
    const hi = who ? `${who}, ` : "";
    const goal = athleteGoalBit(snap);
    const goalBit = goal ? ` That fits ${goal}.` : "";
    if (snap.todayPlanKind === "rest") {
      return `${hi}your week board says rest today. Walk, soft mobility, or skip — both are valid. Don't invent a guilt session unless you truly want it.`;
    }
    if (snap.todayPlanLabel) {
      return `${hi}your week board already picked ${snap.todayPlanLabel}.${goalBit} Open Today and hit Let's go — that's the session. Extra accessories only if joints feel good.`;
    }
    if (snap.daysTrainedThisWeek >= 5) {
      return `${hi}you've already trained most of this week. A walk, mobility, or a short pump session is plenty. Save the heavy work for the next block.`;
    }
    const lag = [...snap.lifts].sort((a, b) => a.weeksFlat - b.weeksFlat)[0];
    return lag
      ? `${hi}nothing locked on the week board yet. If you're choosing, ${lag.name} still has room — or tap Mon–Sun on Home and assign Push / Pull / Legs.`
      : `${hi}nothing on today's board. Tap Mon–Sun on Home, assign a template or rest, then start from Today.`;
  }

  if (/bench|squat|deadlift|press|trend/.test(q)) {
    const hit = snap.lifts.find((l) => q.includes(l.name.toLowerCase().split(" ")[0] ?? "___")) ?? snap.lifts[0];
    if (!hit) return "Log a few more sessions on that lift and I can read the trend.";
    if (hit.changePct == null) return `${hit.name} doesn’t have enough history yet. Two or three hard sessions will give a line.`;
    return `${hit.name} estimated 1RM is ${hit.latest}. That’s ${hit.changePct}% from the session before. ${hit.weeksFlat >= 3 ? "It’s been flat — normal. Push reps, not ego weight." : "The line is still moving. Stay the course."}`;
  }

  if (/sleep|insomnia|3am|wake up|tired|exhausted|shift/.test(q)) {
    return "Sleep beats another set. Same bedtime most nights, dark room, no heavy meal in the last hour. If shift work wrecks the clock, protect a 7-hour block even if it isn’t overnight. Skip the extra pre-workout when you’re already wired. Train, then wind down — don’t chase both.";
  }

  if (/eat|food|protein|diet|calorie|hungry|meal|cut|bulk/.test(q)) {
    const who = athleteWho(snap);
    const goal = athleteGoalBit(snap);
    const hi = who ? `${who}, ` : "";
    const wt = snap.athlete?.weightLb != null ? ` At ~${Math.round(snap.athlete.weightLb)}lb,` : "";
    if (goal === "losing fat") {
      return `${hi}keep it boring.${wt} protein at each meal, veggies when you can, water at work. A cut is a small calorie drop plus walking — not a war on carbs. Forge logs the work; MyFitnessPal can hold the groceries.`;
    }
    if (goal === "building muscle" || goal === "getting stronger") {
      return `${hi}keep it boring.${wt} protein at each meal (meat, eggs, dairy, or a shake) and a small surplus beats dirty bulk chaos. Same lifts, honest log. MFP for food if you want numbers — Forge is for the work.`;
    }
    return `${hi}keep it boring.${wt} protein at each meal, veggies when you can, drink water. A cut is a small drop plus walking; a bulk is a small surplus and the same lifts. If MyFitnessPal is linked, log there — Forge is for the work.`;
  }

  if (/stress|anxiety|motivation|mood|quit|don't want|dont want|burnout/.test(q)) {
    return "Low motivation is common after hard weeks and rough days. Shrink the session: three lifts, leave. That’s still training. Stress dumps into the body — walk, sleep, and a workout that doesn’t grind you will do more than a pep talk. You’re not broken for wanting the couch.";
  }

  if (/cardio|steps|walk|run|condition/.test(q)) {
    return "Cardio supports the lifts; it doesn’t replace them. Walk most days. Add a machine or a jog on easier lifting days. If legs are heavy from squats, keep cardio easy. Steps are the floor — they don’t need to be a hero number.";
  }

  if (/sore|pain|hurt|injury|joint|elbow|knee|shoulder|back pain/.test(q)) {
    return "Soreness that fades as you warm up is normal. Sharp pain, swelling, or something that changes how you walk or press is not — get it looked at. For the dull stuff: drop load 10–20%, swap to a friendlier variation, and don’t train through a stab. Ice and guessing are not a plan.";
  }

  if (/weight|fat|scale|belly/.test(q)) {
    const who = athleteWho(snap);
    const hi = who ? `${who}, ` : "";
    const wt = snap.athlete?.weightLb != null ? ` Your card says ~${Math.round(snap.athlete.weightLb)}lb —` : "";
    const goal = athleteGoalBit(snap);
    const aim =
      goal === "losing fat"
        ? " For fat loss, trust the weekly average and photos more than one morning."
        : goal === "building muscle"
          ? " Muscle goals care more about strength and photos than the daily scale bounce."
          : " Watch the weekly average and the photos, not one morning.";
    return `${hi}the scale jumps with salt, sleep, and training.${wt}${aim} Strength going up while the waist is quiet is still a win. Eat enough protein, walk, lift.`;
  }

  if (/work|job|time|busy|life|routine|habit/.test(q)) {
    return "Build the session into the day you already have — after work, before supper, same bag packed. Forty focused minutes beat a perfect two-hour plan you skip. When life is loud, keep the lifts, cut the extras. Consistency is just showing up ugly.";
  }

  if (/hello|hi\b|hey|what's up|whats up|how are you/.test(q)) {
    const who = athleteWho(snap);
    const goal = athleteGoalBit(snap);
    const body = athleteBodyBit(snap);
    const greet = who ? `Hey ${who}.` : "Hey.";
    const profile =
      goal || body
        ? ` ${[goal ? `Goal: ${goal}` : null, body ? `Card: ${body}` : null].filter(Boolean).join(". ")}.`
        : "";
    return snap.sessionsTotal
      ? `${greet}${profile} I'm here for training or anything else — dinner, sleep, a rough day, whatever. You've got ${snap.sessionsTotal} sessions in the log if you want to talk lifts.`
      : `${greet}${profile} Ask about the gym, food, sleep, or anything else on your mind.`;
  }

  if (/weather|recipe|cook|movie|show|game|news|joke|funny/.test(q)) {
    return "I can talk about that — send the question again with a bit more detail (what you want, any constraints) and I'll answer it straight. I won't pivot it into a workout unless you ask.";
  }

  return "Ask whatever you want — lifting, food, sleep, work, or everyday stuff. I'll use your log when it actually helps and skip the guilt.";
}

export function snapshotPrompt(snap: CoachSnapshot): string {
  const lifts = snap.lifts
    .map((l) => `${l.name}: e1RM ${l.latest ?? "—"} (${l.changePct ?? 0}%, flat ${l.weeksFlat} wk)`)
    .join("; ");
  const a = snap.athlete;
  const athlete =
    a && (a.name || a.age || a.heightCm || a.weightLb || a.goal)
      ? `athlete=${JSON.stringify({ name: a.name, age: a.age, heightCm: a.heightCm, weightLb: a.weightLb, goal: a.goal ?? null })}; `
      : "";
  return `${athlete}Sessions=${snap.sessionsTotal}; weeks=${snap.weeksLogged}; thisWeekSessions=${snap.thisWeekSessions}; volChange=${snap.volumeChangePct ?? "n/a"}%; hardWeeksInARow=${snap.hardWeeks}; today=${snap.todayPlanLabel ?? snap.todayPlanKind ?? "n/a"}; lifts: ${lifts || "none"}`;
}
