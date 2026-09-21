import { a as newId } from "./utils-DcJqOWe7.mjs";
import { listMonitorSummaries } from "./monitors-B6YO37jz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pages-50mNBVK5.js
async function listPages(sql) {
	const pages = await sql`
    select id, slug, title, description, published, created_at
    from status_pages
    order by title
  `;
	const links = await sql`
    select page_id, monitor_id from status_page_monitors order by sort_order
  `;
	const map = /* @__PURE__ */ new Map();
	for (const l of links) {
		const arr = map.get(l.page_id) ?? [];
		arr.push(l.monitor_id);
		map.set(l.page_id, arr);
	}
	return pages.map((p) => ({
		id: p.id,
		slug: p.slug,
		title: p.title,
		description: p.description,
		published: Boolean(p.published),
		monitorIds: map.get(p.id) ?? [],
		createdAt: typeof p.created_at === "string" ? p.created_at : new Date(p.created_at).toISOString()
	}));
}
async function upsertPage(sql, userId, input) {
	const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
	const title = input.title.trim();
	if (!slug) throw new Error("Slug is required");
	if (!title) throw new Error("Title is required");
	const id = input.id ?? newId();
	if (input.id) await sql`
      update status_pages
      set slug = ${slug}, title = ${title}, description = ${input.description}, published = ${input.published}
      where id = ${id}
    `;
	else await sql`
      insert into status_pages (id, slug, title, description, published, created_by)
      values (${id}, ${slug}, ${title}, ${input.description}, ${input.published}, ${userId})
    `;
	await sql`delete from status_page_monitors where page_id = ${id}`;
	for (let i = 0; i < input.monitorIds.length; i += 1) await sql`
      insert into status_page_monitors (page_id, monitor_id, sort_order)
      values (${id}, ${input.monitorIds[i]}, ${i})
    `;
	return id;
}
async function deletePage(sql, id) {
	await sql`delete from status_pages where id = ${id}`;
}
async function getPublicPage(sql, slug) {
	const page = (await sql`
    select id, slug, title, description, published, created_at
    from status_pages
    where slug = ${slug} and published = true
  `)[0];
	if (!page) return null;
	const links = await sql`
    select monitor_id from status_page_monitors where page_id = ${page.id} order by sort_order
  `;
	const all = await listMonitorSummaries(sql);
	const byId = new Map(all.map((m) => [m.id, m]));
	const monitors = [];
	for (const link of links) {
		const m = byId.get(link.monitor_id);
		if (!m) continue;
		monitors.push({
			id: m.id,
			name: m.name,
			lastStatus: m.lastStatus,
			uptime24h: m.uptime24h,
			lastPing: m.lastPing,
			beats: m.beats
		});
	}
	return {
		title: page.title,
		description: page.description,
		monitors
	};
}
//#endregion
export { deletePage, getPublicPage, listPages, upsertPage };
