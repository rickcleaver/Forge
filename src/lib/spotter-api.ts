import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { uid } from "@/lib/utils";
import type { SpotterPack, SpotterPlan } from "@/lib/spotter";

export type SpotterRole = "athlete" | "coach";

export type DeskClient = {
  athleteId: string;
  handle: string;
  week: SpotterPack | null;
  planAt: number | null;
  lastMessage: string | null;
  lastChatAt: number | null;
};

export type DeskMessage = {
  id: string;
  senderId: string;
  body: string;
  at: number;
};

function code6(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function parsePack(raw: string): SpotterPack | null {
  try {
    return JSON.parse(raw) as SpotterPack;
  } catch {
    return null;
  }
}

export const getSpotterDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const me = await sql<{ user_id: string; handle: string; role: string }>`
      select user_id, handle, role from spotter_profiles where user_id = ${context.userId}
    `;
    const profile = me[0] ?? null;
    if (!profile) {
      return { profile: null as null, invite: null as string | null, clients: [] as DeskClient[], coach: null as null };
    }
    if (profile.role === "coach") {
      let invites = await sql<{ code: string }>`
        select code from spotter_invites where coach_id = ${context.userId} order by created_at desc limit 1
      `;
      if (!invites[0]) {
        const code = code6();
        await sql`insert into spotter_invites (code, coach_id) values (${code}, ${context.userId})`;
        invites = [{ code }];
      }
      const links = await sql<{ athlete_id: string; handle: string; payload: string | null; plan_at: string | null }>`
        select l.athlete_id,
          coalesce(p.handle, 'Athlete') as handle,
          w.payload,
          pl.created_at::text as plan_at
        from spotter_links l
        left join spotter_profiles p on p.user_id = l.athlete_id
        left join spotter_weeks w on w.athlete_id = l.athlete_id
        left join spotter_plans pl on pl.athlete_id = l.athlete_id
        where l.coach_id = ${context.userId}
        order by l.created_at desc
      `;
      const chats = await sql<{ athlete_id: string; sender_id: string; created_at: string }>`
        select athlete_id, sender_id, created_at::text
        from spotter_messages
        where coach_id = ${context.userId}
        order by created_at desc
      `;
      const lastChat = new Map<string, { senderId: string; at: number }>();
      for (const row of chats) {
        if (lastChat.has(row.athlete_id)) continue;
        lastChat.set(row.athlete_id, { senderId: row.sender_id, at: Date.parse(row.created_at) || 0 });
      }
      return {
        profile: { handle: profile.handle, role: "coach" as const },
        invite: invites[0]?.code ?? null,
        clients: links.map((r) => ({
          athleteId: r.athlete_id,
          handle: r.handle,
          week: r.payload ? parsePack(r.payload) : null,
          planAt: r.plan_at ? Date.parse(r.plan_at) : null,
          lastMessage: lastChat.get(r.athlete_id)?.senderId ?? null,
          lastChatAt: lastChat.get(r.athlete_id)?.at ?? null,
        })),
        coach: null,
      };
    }
    const link = await sql<{ coach_id: string; handle: string }>`
      select l.coach_id, coalesce(p.handle, 'Coach') as handle
      from spotter_links l
      left join spotter_profiles p on p.user_id = l.coach_id
      where l.athlete_id = ${context.userId}
      limit 1
    `;
    return {
      profile: { handle: profile.handle, role: "athlete" as const },
      invite: null,
      clients: [],
      coach: link[0] ? { coachId: link[0].coach_id, handle: link[0].handle } : null,
    };
  });

export const saveSpotterProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { handle: string; role: SpotterRole }) => ({
    handle: d.handle.trim().slice(0, 32) || "Forge",
    role: d.role === "coach" ? "coach" : "athlete",
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into spotter_profiles (user_id, handle, role)
      values (${context.userId}, ${data.handle}, ${data.role})
      on conflict (user_id) do update set handle = excluded.handle, role = excluded.role
    `;
    let invite: string | null = null;
    if (data.role === "coach") {
      const existing = await sql<{ code: string }>`
        select code from spotter_invites where coach_id = ${context.userId} order by created_at desc limit 1
      `;
      if (existing[0]) invite = existing[0].code;
      else {
        invite = code6();
        await sql`insert into spotter_invites (code, coach_id) values (${invite}, ${context.userId})`;
      }
    }
    return { ok: true, invite };
  });

export const makeCoachInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const me = await sql<{ role: string }>`select role from spotter_profiles where user_id = ${context.userId}`;
    if (me[0]?.role !== "coach") throw new Error("Only a coach can make an invite.");
    const code = code6();
    await sql`delete from spotter_invites where coach_id = ${context.userId}`;
    await sql`insert into spotter_invites (code, coach_id) values (${code}, ${context.userId})`;
    return { code };
  });

export const joinCoach = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((code: string) => code.trim().toUpperCase())
  .handler(async ({ context, data: code }) => {
    if (code.length < 4) throw new Error("Need the 6-letter code.");
    const sql = await getSql();
    const me = await sql<{ role: string }>`select role from spotter_profiles where user_id = ${context.userId}`;
    if (me[0]?.role !== "athlete") throw new Error("Join from the athlete side.");
    const inv = await sql<{ coach_id: string }>`select coach_id from spotter_invites where code = ${code}`;
    if (!inv[0]) throw new Error("That code is not live.");
    const id = uid();
    await sql`delete from spotter_links where athlete_id = ${context.userId}`;
    await sql`
      insert into spotter_links (id, coach_id, athlete_id)
      values (${id}, ${inv[0].coach_id}, ${context.userId})
      on conflict (coach_id, athlete_id) do nothing
    `;
    return { ok: true };
  });

export const publishWeek = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((payload: string) => payload)
  .handler(async ({ context, data }) => {
    JSON.parse(data);
    const sql = await getSql();
    await sql`
      insert into spotter_weeks (athlete_id, payload, updated_at)
      values (${context.userId}, ${data}, now())
      on conflict (athlete_id) do update set payload = excluded.payload, updated_at = now()
    `;
    return { ok: true };
  });

export const pullCoachPlan = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ payload: string; created_at: string }>`
      select payload, created_at::text from spotter_plans where athlete_id = ${context.userId}
    `;
    if (!rows[0]) return null as SpotterPlan | null;
    try {
      return JSON.parse(rows[0].payload) as SpotterPlan;
    } catch {
      return null;
    }
  });

export const sendClientPlan = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { athleteId: string; payload: string }) => d)
  .handler(async ({ context, data }) => {
    JSON.parse(data.payload);
    const sql = await getSql();
    const link = await sql<{ id: string }>`
      select id from spotter_links where coach_id = ${context.userId} and athlete_id = ${data.athleteId}
    `;
    if (!link[0]) throw new Error("That client is not linked to you.");
    await sql`
      insert into spotter_plans (athlete_id, coach_id, payload, created_at)
      values (${data.athleteId}, ${context.userId}, ${data.payload}, now())
      on conflict (athlete_id) do update set coach_id = excluded.coach_id, payload = excluded.payload, created_at = now()
    `;
    return { ok: true };
  });

export const listChat = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { athleteId: string; coachId: string }) => d)
  .handler(async ({ context, data }) => {
    if (context.userId !== data.athleteId && context.userId !== data.coachId) {
      throw new Error("Not on this thread.");
    }
    const sql = await getSql();
    const rows = await sql<{ id: string; sender_id: string; body: string; created_at: string }>`
      select id, sender_id, body, created_at::text
      from spotter_messages
      where coach_id = ${data.coachId} and athlete_id = ${data.athleteId}
      order by created_at asc
      limit 80
    `;
    return rows.map((r) => ({
      id: r.id,
      senderId: r.sender_id,
      body: r.body,
      at: Date.parse(r.created_at) || Date.now(),
    })) satisfies DeskMessage[];
  });

export const sendChat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { athleteId: string; coachId: string; body: string }) => ({
    athleteId: d.athleteId,
    coachId: d.coachId,
    body: d.body.trim().slice(0, 500),
  }))
  .handler(async ({ context, data }) => {
    if (!data.body) return { ok: false };
    if (context.userId !== data.athleteId && context.userId !== data.coachId) {
      throw new Error("Not on this thread.");
    }
    const sql = await getSql();
    const link = await sql<{ id: string }>`
      select id from spotter_links where coach_id = ${data.coachId} and athlete_id = ${data.athleteId}
    `;
    if (!link[0]) throw new Error("Not linked.");
    const id = uid();
    await sql`
      insert into spotter_messages (id, coach_id, athlete_id, sender_id, body)
      values (${id}, ${data.coachId}, ${data.athleteId}, ${context.userId}, ${data.body})
    `;
    return { ok: true };
  });

export const startEmailConfirm = createServerFn({ method: "POST" })
  .validator((email: string) => email.trim().toLowerCase())
  .handler(async ({ data: email }) => {
    if (!email.includes("@")) throw new Error("Need a real email.");
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
    const sql = await getSql();
    await sql`
      insert into spotter_email_codes (email, code, created_at)
      values (${email}, ${code}, now())
      on conflict (email) do update set code = excluded.code, created_at = now()
    `;
    return { email, code, mailed: false };
  });

export const checkEmailConfirm = createServerFn({ method: "POST" })
  .validator((d: { email: string; code: string }) => ({
    email: d.email.trim().toLowerCase(),
    code: d.code.trim().toUpperCase(),
  }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<{ code: string; created_at: string }>`
      select code, created_at::text from spotter_email_codes where email = ${data.email}
    `;
    const row = rows[0];
    if (!row) throw new Error("No code for that email. Send one first.");
    if (Date.now() - Date.parse(row.created_at) > 30 * 60_000) throw new Error("That code expired. Send a new one.");
    if (row.code !== data.code) throw new Error("That code does not match.");
    await sql`delete from spotter_email_codes where email = ${data.email}`;
    return { ok: true };
  });
