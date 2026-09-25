import { format } from "date-fns";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { e1rmHistory, exerciseHistory, formatPrevLoad, type ExerciseIdentity } from "@/lib/stats";
import { useGym } from "@/lib/store";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "./ui/drawer";

export function LiftHistory({
  exercise,
  exceptSessionId,
  open,
  onOpenChange,
}: {
  exercise: ExerciseIdentity;
  exceptSessionId?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const sessions = useGym((s) => s.sessions);
  const unit = useGym((s) => s.settings.unit);
  const rows = exerciseHistory(sessions, exercise, exceptSessionId);
  const trend = e1rmHistory(sessions, exercise, exceptSessionId);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex max-h-[80dvh] flex-col gap-4 overflow-y-auto px-5 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div>
            <DrawerTitle>{exercise.name}</DrawerTitle>
            <DrawerDescription>Previous working sets, newest first.</DrawerDescription>
          </div>

          {trend.length >= 2 ? (
            <div className="rounded-lg bg-surface-2 px-3 py-3">
              <p className="font-mono text-[10px] tracking-wider text-muted uppercase">
                Estimated 1RM trend
              </p>
              <div className="mt-2 h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                    <XAxis
                      dataKey="when"
                      tickFormatter={(v: number) => format(v, "d MMM")}
                      tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      dataKey="e1rm"
                      tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value} ${unit}`, "e1RM"]}
                      labelFormatter={(v: number) => format(v, "EEE d MMM")}
                      contentStyle={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="e1rm"
                      stroke="var(--color-accent)"
                      strokeWidth={2}
                      dot={{ r: 2.5 }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}

          {rows.length === 0 ? (
            <p className="py-6 text-sm text-muted">No finished history for this lift yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {rows.map((row) => (
                <li key={row.sessionId} className="rounded-lg bg-surface-2 px-3 py-3">
                  <p className="font-medium">{row.sessionName}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted">
                    {format(row.when, "EEE d MMM")}
                  </p>
                  <p className="mt-2 font-mono text-xs text-fg tabular-nums">
                    {row.sets
                      .filter((s) => !s.warmup)
                      .map((s) => formatPrevLoad(s.weight, s.reps))
                      .join(" · ") || "—"}
                    <span className="text-subtle"> {unit}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
