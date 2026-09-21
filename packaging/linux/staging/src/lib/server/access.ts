import { getSql, type Sql } from "@/lib/db";
import { newId } from "@/lib/utils";
import { ROLE_RANK, type AccessState, type Role } from "@/lib/types";

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

type UserRow = { id: string; name: string; email: string };

export async function bootstrapIfNeeded(sql: Sql, userId: string): Promise<void> {
  const count = await sql<{ n: number }>`select count(*)::int as n from members`;
  if ((count[0]?.n ?? 0) > 0) return;

  await sql`
    insert into members (user_id, role, created_by)
    values (${userId}, 'owner', ${userId})
    on conflict (user_id) do nothing
  `;
  await seedDefaults(sql, userId);
}

async function seedDefaults(sql: Sql, userId: string) {
  const existing = await sql<{ n: number }>`select count(*)::int as n from monitors`;
  if ((existing[0]?.n ?? 0) > 0) return;

  const seeds: Array<{
    name: string;
    type: string;
    url?: string;
    hostname?: string;
    port?: number;
    interval: number;
  }> = [
    { name: "Google", type: "http", url: "https://www.google.com", interval: 60 },
    { name: "GitHub", type: "http", url: "https://github.com", interval: 60 },
    { name: "Cloudflare DNS", type: "http", url: "https://1.1.1.1", interval: 60 },
    { name: "Example TCP 443", type: "tcp", hostname: "example.com", port: 443, interval: 60 },
    { name: "Unreachable host", type: "http", url: "https://this-host-does-not-exist.pulsewatch.invalid", interval: 120 },
  ];

  const ids: string[] = [];
  for (const seed of seeds) {
    const id = newId();
    ids.push(id);
    await sql`
      insert into monitors (
        id, name, type, url, hostname, port, interval_sec, timeout_sec, created_by
      ) values (
        ${id}, ${seed.name}, ${seed.type}, ${seed.url ?? null}, ${seed.hostname ?? null},
        ${seed.port ?? null}, ${seed.interval}, 12, ${userId}
      )
    `;
  }

  const pageId = newId();
  await sql`
    insert into status_pages (id, slug, title, description, published, created_by)
    values (${pageId}, 'public', 'Pulsewatch Status', 'Live availability of core endpoints.', true, ${userId})
  `;
  for (let i = 0; i < ids.length - 1; i += 1) {
    await sql`
      insert into status_page_monitors (page_id, monitor_id, sort_order)
      values (${pageId}, ${ids[i]}, ${i})
    `;
  }
}

export async function getAccess(userId: string): Promise<AccessState> {
  const sql = await getSql();
  await bootstrapIfNeeded(sql, userId);
  const users = await sql<UserRow>`
    select id, name, email from "user" where id = ${userId}
  `;
  const user = users[0];
  const members = await sql<{ role: Role }>`select role from members where user_id = ${userId}`;
  const role = members[0]?.role ?? (await maybeClaimPasswordOwner(sql, userId));
  if (!role) {
    return {
      status: "denied",
      userId,
      email: user?.email ?? null,
      name: user?.name ?? null,
    };
  }
  return {
    status: "ok",
    role,
    userId,
    email: user?.email ?? null,
    name: user?.name ?? null,
  };
}

export async function requireMember(userId: string, minRole: Role = "viewer"): Promise<{ role: Role; sql: Sql }> {
  const sql = await getSql();
  await bootstrapIfNeeded(sql, userId);
  const rows = await sql<{ role: Role }>`select role from members where user_id = ${userId}`;
  const role = rows[0]?.role ?? (await maybeClaimPasswordOwner(sql, userId));
  if (!role) throw new ForbiddenError("Your account is not authorized to use this dashboard.");
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    throw new ForbiddenError("You do not have permission for this action.");
  }
  return { role, sql };
}

export async function countMembers(sql: Sql): Promise<number> {
  const rows = await sql<{ n: number }>`select count(*)::int as n from members`;
  return rows[0]?.n ?? 0;
}

/**
 * If the instance was claimed by an SSO/gate identity that has no password,
 * the first email/password user can become owner so the host is not locked
 * out of the CLI / login form.
 */
async function maybeClaimPasswordOwner(sql: Sql, userId: string): Promise<Role | null> {
  const cred = await sql<{ id: string }>`
    select id from account
    where "userId" = ${userId} and "providerId" = 'credential' and password is not null
  `;
  if (!cred[0]) return null;
  const passwordOwners = await sql<{ n: number }>`
    select count(*)::int as n
    from members m
    join account a on a."userId" = m.user_id
    where a."providerId" = 'credential' and a.password is not null
      and m.role in ('owner', 'admin')
  `;
  if (Number(passwordOwners[0]?.n ?? 0) > 0) return null;
  await sql`
    insert into members (user_id, role, created_by)
    values (${userId}, 'owner', ${userId})
    on conflict (user_id) do nothing
  `;
  const again = await sql<{ role: Role }>`select role from members where user_id = ${userId}`;
  return again[0]?.role ?? null;
}

