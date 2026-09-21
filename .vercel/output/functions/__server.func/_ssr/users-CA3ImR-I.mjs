import { t as hashPassword$1 } from "./password-VlpK0Xix.mjs";
import { a as newId } from "./utils-DcJqOWe7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/users-CA3ImR-I.js
async function listMembers(sql) {
	return (await sql`
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
  `).map((r) => ({
		userId: r.user_id,
		email: r.email,
		name: r.name,
		role: r.role,
		createdAt: typeof r.created_at === "string" ? r.created_at : new Date(r.created_at).toISOString(),
		hasPassword: Boolean(r.has_password)
	}));
}
async function addMember(sql, actorId, input) {
	const email = input.email.trim().toLowerCase();
	const name = input.name.trim() || email.split("@")[0] || "User";
	if (!email.includes("@")) throw new Error("A valid email is required");
	if (input.role === "owner") throw new Error("Owner role cannot be assigned this way");
	let userId = (await sql`select id from "user" where email = ${email}`)[0]?.id;
	if (!userId) {
		if (!input.password || input.password.length < 8) throw new Error("New users need a password of at least 8 characters");
		userId = newId();
		const now = (/* @__PURE__ */ new Date()).toISOString();
		await sql`
      insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
      values (${userId}, ${name}, ${email}, true, ${now}, ${now})
    `;
		const hash = await hashPassword$1(input.password);
		await sql`
      insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      values (${newId()}, ${userId}, 'credential', ${userId}, ${hash}, ${now}, ${now})
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
async function setMemberRole(sql, actorId, userId, role) {
	if (userId === actorId) throw new Error("You cannot change your own role");
	if (role === "owner") throw new Error("Promote via transferring ownership instead");
	const target = await sql`select role from members where user_id = ${userId}`;
	if (!target[0]) throw new Error("User is not a member");
	if (target[0].role === "owner") throw new Error("The owner cannot be demoted");
	await sql`update members set role = ${role} where user_id = ${userId}`;
}
async function removeMember(sql, actorId, userId) {
	if (userId === actorId) throw new Error("You cannot remove yourself");
	if ((await sql`select role from members where user_id = ${userId}`)[0]?.role === "owner") throw new Error("The owner cannot be removed");
	await sql`delete from members where user_id = ${userId}`;
}
async function setPassword(sql, userId, password) {
	if (password.length < 8) throw new Error("Password must be at least 8 characters");
	const hash = await hashPassword$1(password);
	const existing = await sql`
    select id from account where "userId" = ${userId} and "providerId" = 'credential'
  `;
	const now = (/* @__PURE__ */ new Date()).toISOString();
	if (existing[0]) await sql`
      update account set password = ${hash}, "updatedAt" = ${now}
      where id = ${existing[0].id}
    `;
	else await sql`
      insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      values (${newId()}, ${userId}, 'credential', ${userId}, ${hash}, ${now}, ${now})
    `;
}
//#endregion
export { addMember, listMembers, removeMember, setMemberRole, setPassword };
