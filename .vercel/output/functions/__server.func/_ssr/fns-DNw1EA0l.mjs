import { r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-BP8X2JkE.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fns-DNw1EA0l.js
var getAccessState_createServerFn_handler = createServerRpc({
	id: "c78d5709ee3f3fcde071f5c61d8d16b5f25632fa3d563b336861f028355b85cf",
	name: "getAccessState",
	filename: "src/lib/server/fns.ts"
}, (opts) => getAccessState.__executeServer(opts));
var getAccessState = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getAccessState_createServerFn_handler, async ({ context }) => {
	const { getAccess } = await import("./access-CikIyw10.mjs");
	return getAccess(context.userId);
});
var getSetupState_createServerFn_handler = createServerRpc({
	id: "48295fd14f53bc904ac6f548ce1e295c621626c4abd1e8be4d8ddc4c54a979cc",
	name: "getSetupState",
	filename: "src/lib/server/fns.ts"
}, (opts) => getSetupState.__executeServer(opts));
var getSetupState = createServerFn({ method: "GET" }).handler(getSetupState_createServerFn_handler, async () => {
	const { getSql } = await import("./db-BFEHevtK.mjs").then((n) => n.t).then((n) => n.t);
	const rows = await (await getSql())`select count(*)::int as n from members`;
	return { needsSetup: Number(rows[0]?.n ?? 0) === 0 };
});
var listMonitorsFn_createServerFn_handler = createServerRpc({
	id: "d15db79600b737d5999be3bdabc326615427bf0ab29a1183e310c9e3713631e4",
	name: "listMonitorsFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => listMonitorsFn.__executeServer(opts));
var listMonitorsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listMonitorsFn_createServerFn_handler, async ({ context }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { listMonitorSummaries } = await import("./monitors-B6YO37jz.mjs");
	const { kickDueChecks } = await import("./engine-BD5vbAng.mjs");
	const { sql } = await requireMember(context.userId);
	kickDueChecks();
	return listMonitorSummaries(sql);
});
var getMonitorFn_createServerFn_handler = createServerRpc({
	id: "36b09dc8a8ec4db694d6eb117ae139161de03822e209e592386125a3fbae8d56",
	name: "getMonitorFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => getMonitorFn.__executeServer(opts));
var getMonitorFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => id).handler(getMonitorFn_createServerFn_handler, async ({ context, data: id }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { getMonitor } = await import("./monitors-B6YO37jz.mjs");
	const { sql } = await requireMember(context.userId);
	return getMonitor(sql, id);
});
var saveMonitorFn_createServerFn_handler = createServerRpc({
	id: "eaaad62e75e9deae945e18954e5cb1858ee2e6ac24c19fbe5db746617061a508",
	name: "saveMonitorFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => saveMonitorFn.__executeServer(opts));
var saveMonitorFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(saveMonitorFn_createServerFn_handler, async ({ context, data }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { upsertMonitor } = await import("./monitors-B6YO37jz.mjs");
	const { sql } = await requireMember(context.userId, "editor");
	return { id: await upsertMonitor(sql, context.userId, data) };
});
var deleteMonitorFn_createServerFn_handler = createServerRpc({
	id: "7e948dc47ab561ba6d3c2a3f3114fd056aa50aa3188dc0284bbd404768b55ce6",
	name: "deleteMonitorFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => deleteMonitorFn.__executeServer(opts));
var deleteMonitorFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(deleteMonitorFn_createServerFn_handler, async ({ context, data: id }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { deleteMonitor } = await import("./monitors-B6YO37jz.mjs");
	const { sql } = await requireMember(context.userId, "editor");
	await deleteMonitor(sql, id);
});
var setMonitorActiveFn_createServerFn_handler = createServerRpc({
	id: "bd4f0198f746340bf4ced015bafa110c414ff15a0ac8e6d09c2fcf10060b35bc",
	name: "setMonitorActiveFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => setMonitorActiveFn.__executeServer(opts));
var setMonitorActiveFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(setMonitorActiveFn_createServerFn_handler, async ({ context, data }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { setMonitorActive } = await import("./monitors-B6YO37jz.mjs");
	const { sql } = await requireMember(context.userId, "editor");
	await setMonitorActive(sql, data.id, data.active);
});
var setMonitorChannelsFn_createServerFn_handler = createServerRpc({
	id: "be009867ef532a1ff39fa0954f840183bf8aace6a3df77668d34196129b7df4c",
	name: "setMonitorChannelsFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => setMonitorChannelsFn.__executeServer(opts));
var setMonitorChannelsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(setMonitorChannelsFn_createServerFn_handler, async ({ context, data }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { setMonitorChannels } = await import("./channels-DJE3Et1_.mjs");
	const { sql } = await requireMember(context.userId, "editor");
	await setMonitorChannels(sql, data.monitorId, data.channelIds);
});
var getMonitorChannelsFn_createServerFn_handler = createServerRpc({
	id: "ea7884b6a2d21f1497d28f3b34f023f9f154425ef641ecca135e1db5e371b965",
	name: "getMonitorChannelsFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => getMonitorChannelsFn.__executeServer(opts));
var getMonitorChannelsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((monitorId) => monitorId).handler(getMonitorChannelsFn_createServerFn_handler, async ({ context, data: monitorId }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { getMonitorChannelIds } = await import("./channels-DJE3Et1_.mjs");
	const { sql } = await requireMember(context.userId);
	return getMonitorChannelIds(sql, monitorId);
});
var tickMonitorsFn_createServerFn_handler = createServerRpc({
	id: "11987372b041eba42a0d24b8925759b57e0ae9e963873d2552f6d166ffa1bd53",
	name: "tickMonitorsFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => tickMonitorsFn.__executeServer(opts));
var tickMonitorsFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(tickMonitorsFn_createServerFn_handler, async ({ context }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { runDueChecks } = await import("./engine-BD5vbAng.mjs");
	await requireMember(context.userId);
	return runDueChecks();
});
var listMembersFn_createServerFn_handler = createServerRpc({
	id: "c030d4763f3b4fcf9f053ca7ac4d7b1a090b9d10ea28b08a11845b83c175cdf4",
	name: "listMembersFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => listMembersFn.__executeServer(opts));
var listMembersFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listMembersFn_createServerFn_handler, async ({ context }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { listMembers } = await import("./users-CA3ImR-I.mjs");
	const { sql } = await requireMember(context.userId, "admin");
	return listMembers(sql);
});
var addMemberFn_createServerFn_handler = createServerRpc({
	id: "f5a7b38416c318cbe55634fe7a8b54510deed56d19c6abc51ec7e4f297e26116",
	name: "addMemberFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => addMemberFn.__executeServer(opts));
var addMemberFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(addMemberFn_createServerFn_handler, async ({ context, data }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { addMember } = await import("./users-CA3ImR-I.mjs");
	const { sql } = await requireMember(context.userId, "admin");
	return { id: await addMember(sql, context.userId, data) };
});
var setMemberRoleFn_createServerFn_handler = createServerRpc({
	id: "858c09afce6aeffdc380dc3fb39ffe643eb10b69e4993570bdbaacfd1cab59fe",
	name: "setMemberRoleFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => setMemberRoleFn.__executeServer(opts));
var setMemberRoleFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(setMemberRoleFn_createServerFn_handler, async ({ context, data }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { setMemberRole } = await import("./users-CA3ImR-I.mjs");
	const { sql } = await requireMember(context.userId, "admin");
	await setMemberRole(sql, context.userId, data.userId, data.role);
});
var removeMemberFn_createServerFn_handler = createServerRpc({
	id: "fa5de8a68051db0411fb59352271621c4f278a5fad540e33200debee298bf720",
	name: "removeMemberFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => removeMemberFn.__executeServer(opts));
var removeMemberFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((userId) => userId).handler(removeMemberFn_createServerFn_handler, async ({ context, data: userId }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { removeMember } = await import("./users-CA3ImR-I.mjs");
	const { sql } = await requireMember(context.userId, "admin");
	await removeMember(sql, context.userId, userId);
});
var setMemberPasswordFn_createServerFn_handler = createServerRpc({
	id: "4c53760817e114c68fc07cf9faa693cc8ab4a23bb56c7a8369670a23425b351a",
	name: "setMemberPasswordFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => setMemberPasswordFn.__executeServer(opts));
var setMemberPasswordFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(setMemberPasswordFn_createServerFn_handler, async ({ context, data }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { setPassword } = await import("./users-CA3ImR-I.mjs");
	const { sql } = await requireMember(context.userId, "admin");
	await setPassword(sql, data.userId, data.password);
});
var listChannelsFn_createServerFn_handler = createServerRpc({
	id: "94fbc39e4956a5e00bc295db0f37146ec29a4d37137d5bdb77bc604158247b92",
	name: "listChannelsFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => listChannelsFn.__executeServer(opts));
var listChannelsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listChannelsFn_createServerFn_handler, async ({ context }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { listChannels } = await import("./channels-DJE3Et1_.mjs");
	const { sql } = await requireMember(context.userId);
	return listChannels(sql);
});
var saveChannelFn_createServerFn_handler = createServerRpc({
	id: "12f0549b6d2962f2d0c5c85c6c874b90a6e5d974080fff553387b30ed4d57f99",
	name: "saveChannelFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => saveChannelFn.__executeServer(opts));
var saveChannelFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(saveChannelFn_createServerFn_handler, async ({ context, data }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { upsertChannel } = await import("./channels-DJE3Et1_.mjs");
	const { sql } = await requireMember(context.userId, "admin");
	return { id: await upsertChannel(sql, context.userId, data) };
});
var deleteChannelFn_createServerFn_handler = createServerRpc({
	id: "81fe819350b3a0b354698aa2de1c64ac6b25420685edf3a254b520716f9ecf9e",
	name: "deleteChannelFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => deleteChannelFn.__executeServer(opts));
var deleteChannelFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(deleteChannelFn_createServerFn_handler, async ({ context, data: id }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { deleteChannel } = await import("./channels-DJE3Et1_.mjs");
	const { sql } = await requireMember(context.userId, "admin");
	await deleteChannel(sql, id);
});
var testChannelFn_createServerFn_handler = createServerRpc({
	id: "f6346fcdd0904ec51d4307ee71eae39572c422db2c464ce896663754f8303cab",
	name: "testChannelFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => testChannelFn.__executeServer(opts));
var testChannelFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(testChannelFn_createServerFn_handler, async ({ context, data: id }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { sendTestChannel } = await import("./notify-pRe8RVhC.mjs");
	const { sql } = await requireMember(context.userId, "admin");
	await sendTestChannel(sql, id);
});
var listNotifyLogFn_createServerFn_handler = createServerRpc({
	id: "fbe2f2b8b14c616ad1d434660dcc937304b93549730a5a83fbc19c183482e299",
	name: "listNotifyLogFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => listNotifyLogFn.__executeServer(opts));
var listNotifyLogFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listNotifyLogFn_createServerFn_handler, async ({ context }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { listNotifyLog } = await import("./channels-DJE3Et1_.mjs");
	const { sql } = await requireMember(context.userId);
	return listNotifyLog(sql);
});
var listPagesFn_createServerFn_handler = createServerRpc({
	id: "7c85398431f4341d2c32e789df88caf07230a6a933e89c3957352c7c50bd465a",
	name: "listPagesFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => listPagesFn.__executeServer(opts));
var listPagesFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listPagesFn_createServerFn_handler, async ({ context }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { listPages } = await import("./pages-50mNBVK5.mjs");
	const { sql } = await requireMember(context.userId);
	return listPages(sql);
});
var savePageFn_createServerFn_handler = createServerRpc({
	id: "5c4d71fd8c8e0e52616a7f30a2651c63da223858cd53e7d189dc40f0271b4627",
	name: "savePageFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => savePageFn.__executeServer(opts));
var savePageFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(savePageFn_createServerFn_handler, async ({ context, data }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { upsertPage } = await import("./pages-50mNBVK5.mjs");
	const { sql } = await requireMember(context.userId, "editor");
	return { id: await upsertPage(sql, context.userId, data) };
});
var deletePageFn_createServerFn_handler = createServerRpc({
	id: "16b49434f10f1ada0b5e164e89bf502c9d529fbcf625dbe5af0ccebd1de1f63c",
	name: "deletePageFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => deletePageFn.__executeServer(opts));
var deletePageFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(deletePageFn_createServerFn_handler, async ({ context, data: id }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { deletePage } = await import("./pages-50mNBVK5.mjs");
	const { sql } = await requireMember(context.userId, "editor");
	await deletePage(sql, id);
});
var getPublicStatusFn_createServerFn_handler = createServerRpc({
	id: "4c235f2012ed73055deb4125cb0612e70274b2d725da5af9a4825a8f262dee65",
	name: "getPublicStatusFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => getPublicStatusFn.__executeServer(opts));
var getPublicStatusFn = createServerFn({ method: "GET" }).validator((slug) => slug).handler(getPublicStatusFn_createServerFn_handler, async ({ data: slug }) => {
	const { getSql } = await import("./db-BFEHevtK.mjs").then((n) => n.t).then((n) => n.t);
	const { getPublicPage } = await import("./pages-50mNBVK5.mjs");
	const { kickDueChecks } = await import("./engine-BD5vbAng.mjs");
	kickDueChecks();
	return getPublicPage(await getSql(), slug);
});
var getSiteNameFn_createServerFn_handler = createServerRpc({
	id: "3b485a327660a6c429e32cf2e67c79241c97aa8d3d5be4b4c67a3c000102ee90",
	name: "getSiteNameFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => getSiteNameFn.__executeServer(opts));
var getSiteNameFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getSiteNameFn_createServerFn_handler, async ({ context }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { sql } = await requireMember(context.userId);
	return { siteName: (await sql`select value from site_settings where key = 'site_name'`)[0]?.value ?? "Pulsewatch" };
});
var setSiteNameFn_createServerFn_handler = createServerRpc({
	id: "4604c491db08a645d39132bc6b1cc47759794203665c27c4095e1f2727fb14ad",
	name: "setSiteNameFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => setSiteNameFn.__executeServer(opts));
var setSiteNameFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((siteName) => siteName).handler(setSiteNameFn_createServerFn_handler, async ({ context, data: siteName }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { sql } = await requireMember(context.userId, "admin");
	await sql`
      insert into site_settings (key, value) values ('site_name', ${siteName.trim() || "Pulsewatch"})
      on conflict (key) do update set value = excluded.value
    `;
});
var exportBackupFn_createServerFn_handler = createServerRpc({
	id: "1ab43da2a64ecf8c980242a6d6a5fae75ada850e1ab4dc126e88848742168c72",
	name: "exportBackupFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => exportBackupFn.__executeServer(opts));
var exportBackupFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(exportBackupFn_createServerFn_handler, async ({ context }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { exportBackup } = await import("./backup-WpFH-qBN.mjs");
	const { sql } = await requireMember(context.userId, "admin");
	return exportBackup(sql);
});
var restoreBackupFn_createServerFn_handler = createServerRpc({
	id: "bf048ebca05917ea8802c6b8501bd0c76a993c7a02e2f3cc14f51246d783be8d",
	name: "restoreBackupFn",
	filename: "src/lib/server/fns.ts"
}, (opts) => restoreBackupFn.__executeServer(opts));
var restoreBackupFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(restoreBackupFn_createServerFn_handler, async ({ context, data }) => {
	const { requireMember } = await import("./access-CikIyw10.mjs");
	const { parseBackup, restoreBackup } = await import("./backup-WpFH-qBN.mjs");
	const { sql } = await requireMember(context.userId, "admin");
	const backup = parseBackup(data.backup);
	const users = await sql`select email from "user" where id = ${context.userId}`;
	return restoreBackup(sql, backup, {
		mode: data.mode === "replace" ? "replace" : "merge",
		actorId: context.userId,
		actorEmail: users[0]?.email ?? null
	});
});
//#endregion
export { addMemberFn_createServerFn_handler, deleteChannelFn_createServerFn_handler, deleteMonitorFn_createServerFn_handler, deletePageFn_createServerFn_handler, exportBackupFn_createServerFn_handler, getAccessState_createServerFn_handler, getMonitorChannelsFn_createServerFn_handler, getMonitorFn_createServerFn_handler, getPublicStatusFn_createServerFn_handler, getSetupState_createServerFn_handler, getSiteNameFn_createServerFn_handler, listChannelsFn_createServerFn_handler, listMembersFn_createServerFn_handler, listMonitorsFn_createServerFn_handler, listNotifyLogFn_createServerFn_handler, listPagesFn_createServerFn_handler, removeMemberFn_createServerFn_handler, restoreBackupFn_createServerFn_handler, saveChannelFn_createServerFn_handler, saveMonitorFn_createServerFn_handler, savePageFn_createServerFn_handler, setMemberPasswordFn_createServerFn_handler, setMemberRoleFn_createServerFn_handler, setMonitorActiveFn_createServerFn_handler, setMonitorChannelsFn_createServerFn_handler, setSiteNameFn_createServerFn_handler, testChannelFn_createServerFn_handler, tickMonitorsFn_createServerFn_handler };
