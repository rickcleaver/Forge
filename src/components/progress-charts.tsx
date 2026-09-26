import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { addDays, format, startOfWeek } from "date-fns";
import { muscleHitsThisWeek, sessionVolume, weekTraining } from "@/lib/stats";
import { useGym } from "@/lib/store";
import { MUSCLES } from "@/lib/types";
import { realSessions } from "@/lib/demo-sessions";

export function ProgressCharts() {
  const sessions = realSessions(useGym((s) => s.sessions));
  const weighIns = useGym((s) => s.weighIns);
  const unit = useGym((s) => s.settings.unit);

  const volumeSeries = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 8 }, (_, i) => {
      const from = addDays(start, -7 * (7 - i));
      const to = addDays(from, 7);
      const vol = sessions
        .filter((s) => s.finishedAt && s.finishedAt >= from.getTime() && s.finishedAt < to.getTime())
        .reduce((n, s) => n + sessionVolume(s), 0);
      return { label: format(from, "d MMM"), volume: Math.round(vol) };
    });
  }, [sessions]);

  const weightSeries = useMemo(() => {
    return [...weighIns]
      .sort((a, b) => a.at - b.at)
      .slice(-16)
      .map((w) => ({
        label: format(w.at, "d MMM"),
        lb: Math.round(w.lb * 10) / 10,
      }));
  }, [weighIns]);

  const balanceSeries = useMemo(() => {
    // Use last 4 weeks of hits approximated via current week helper + recent sessions.
    const hits = muscleHitsThisWeek(sessions);
    return MUSCLES.filter((m) => m.id !== "cardio")
      .map((m) => ({ muscle: m.short, sets: hits[m.id] ?? 0 }))
      .sort((a, b) => b.sets - a.sets);
  }, [sessions]);

  const week = weekTraining(sessions);

  return (
    <section className="mt-8 flex flex-col gap-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Weekly volume</h2>
        <p className="text-sm text-muted">
          {week.sessions} sessions this week · {Math.round(week.volume).toLocaleString()} {unit} total
        </p>
        <div className="mt-3 h-44 rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeSeries}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--color-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--color-muted)", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                contentStyle={{ background: "var(--color-surface-2)", border: "none", borderRadius: 12 }}
                labelStyle={{ color: "var(--color-muted)" }}
              />
              <Bar dataKey="volume" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold">Bodyweight</h2>
        <p className="text-sm text-muted">Trend from your weigh-ins. Weekly average matters more than one morning.</p>
        <div className="mt-3 h-44 rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]">
          {weightSeries.length < 2 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted">Log a couple weigh-ins to see the curve.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightSeries}>
                <defs>
                  <linearGradient id="bw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "var(--color-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={["auto", "auto"]} tick={{ fill: "var(--color-muted)", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  contentStyle={{ background: "var(--color-surface-2)", border: "none", borderRadius: 12 }}
                  formatter={(v: number) => [`${v} ${unit}`, "Weight"]}
                />
                <Area type="monotone" dataKey="lb" stroke="var(--color-accent)" fill="url(#bw)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold">Muscle balance</h2>
        <p className="text-sm text-muted">Sets by area this week. Quiet bars are your next accessories.</p>
        <div className="mt-3 h-52 rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={balanceSeries} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: "var(--color-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="muscle" tick={{ fill: "var(--color-muted)", fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: "var(--color-surface-2)", border: "none", borderRadius: 12 }}
              />
              <Bar dataKey="sets" fill="var(--color-accent)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
