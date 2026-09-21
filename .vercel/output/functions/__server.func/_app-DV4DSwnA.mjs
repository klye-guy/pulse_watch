import { r as createServerFn } from "./_ssr/ssr.mjs";
import { t as createServerRpc } from "./_ssr/createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_app-DV4DSwnA.js
var fetchSessionUser_createServerFn_handler = createServerRpc({
	id: "39e1df323982a2c4b8b0edee9668b0121cc254a343c288c537dea0c463481c17",
	name: "fetchSessionUser",
	filename: "src/routes/_app.tsx"
}, (opts) => fetchSessionUser.__executeServer(opts));
var fetchSessionUser = createServerFn({ method: "GET" }).handler(fetchSessionUser_createServerFn_handler, async () => {
	const { getSessionUser } = await import("./_ssr/verify.server-B3rwvJC9.mjs");
	const u = await getSessionUser();
	return u ? {
		id: u.id,
		email: u.email
	} : null;
});
//#endregion
export { fetchSessionUser_createServerFn_handler };
