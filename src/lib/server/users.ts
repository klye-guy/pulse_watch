import { hashPassword } from "better-auth/crypto";
import type { Sql } from "@/lib/db";
import type { MemberRow, Role } from "@/lib/types";
import { newId } from "@/lib/utils";

type UserJoin = {
  user_id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
  has_password: boolean;
};

export async function listMembers(sql: Sql): Promise<MemberRow[]> {
  const rows = await sql<UserJoin>`
    select
      m.user_id,
      u.email,
      u.name,
      m.role,
      m.created_at,
      exists(
        select 1 from account a
        where a."userId" = m.user_id and a."providerId" = 'credential' and a.password is not null
      ) as has_password
    from members m
    join "user" u on u.id = m.user_id
    order by
      case m.role
        when 'owner' then 0
        when 'admin' then 1
        when 'editor' then 2
        else 3
      end,
      u.email
  `;
  return rows.map((r) => ({
    userId: r.user_id,
    email: r.email,
    name: r.name,
    role: r.role,
    createdAt: typeof r.created_at === "string" ? r.created_at : new Date(r.created_at).toISOString(),
    hasPassword: Boolean(r.has_password),
  }));
}

export async function addMember(
  sql: Sql,
  actorId: string,
  input: { email: string; name: string; password?: string; role: Role },
): Promise<string> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim() || email.split("@")[0] || "User";
  if (!email.includes("@")) throw new Error("A valid email is required");
  if (input.role === "owner") throw new Error("Owner role cannot be assigned this way");

  const existing = await sql<{ id: string }>`select id from "user" where email = ${email}`;
  let userId = existing[0]?.id;

  if (!userId) {
    if (!input.password || input.password.length < 8) {
      throw new Error("New users need a password of at least 8 characters");
    }
    userId = newId();
    const now = new Date().toISOString();
    await sql`
      insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
      values (${userId}, ${name}, ${email}, true, ${now}, ${now})
    `;
    const hash = await hashPassword(input.password);
    const accId = newId();
    await sql`
      insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      values (${accId}, ${userId}, 'credential', ${userId}, ${hash}, ${now}, ${now})
    `;
  } else if (input.password && input.password.length >= 8) {
    await setPassword(sql, userId, input.password);
    await sql`update "user" set name = ${name}, "updatedAt" = now() where id = ${userId}`;
  }

  await sql`
    insert into members (user_id, role, created_by)
    values (${userId}, ${input.role}, ${actorId})
    on conflict (user_id) do update set role = excluded.role
  `;
  return userId;
}

export async function setMemberRole(sql: Sql, actorId: string, userId: string, role: Role): Promise<void> {
  if (userId === actorId) throw new Error("You cannot change your own role");
  if (role === "owner") throw new Error("Promote via transferring ownership instead");
  const target = await sql<{ role: Role }>`select role from members where user_id = ${userId}`;
  if (!target[0]) throw new Error("User is not a member");
  if (target[0].role === "owner") throw new Error("The owner cannot be demoted");
  await sql`update members set role = ${role} where user_id = ${userId}`;
}

export async function removeMember(sql: Sql, actorId: string, userId: string): Promise<void> {
  if (userId === actorId) throw new Error("You cannot remove yourself");
  const target = await sql<{ role: Role }>`select role from members where user_id = ${userId}`;
  if (target[0]?.role === "owner") throw new Error("The owner cannot be removed");
  await sql`delete from members where user_id = ${userId}`;
}

export async function setPassword(sql: Sql, userId: string, password: string): Promise<void> {
  if (password.length < 8) throw new Error("Password must be at least 8 characters");
  const hash = await hashPassword(password);
  const existing = await sql<{ id: string }>`
    select id from account where "userId" = ${userId} and "providerId" = 'credential'
  `;
  const now = new Date().toISOString();
  if (existing[0]) {
    await sql`
      update account set password = ${hash}, "updatedAt" = ${now}
      where id = ${existing[0].id}
    `;
  } else {
    await sql`
      insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      values (${newId()}, ${userId}, 'credential', ${userId}, ${hash}, ${now}, ${now})
    `;
  }
}
