import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { C as setMemberPasswordFn, m as listMembersFn, t as addMemberFn, v as removeMemberFn, w as setMemberRoleFn } from "./fns-BD1qJbCk.mjs";
import { t as Button } from "./button-GlTFQgya.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as Input } from "./input-D6GLTri9.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-Bfr74K1a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/users-CEp2zcHC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ROLES = [
	"admin",
	"editor",
	"viewer"
];
function UsersPage() {
	const qc = useQueryClient();
	const members = useQuery({
		queryKey: ["members"],
		queryFn: () => listMembersFn()
	});
	const [email, setEmail] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [role, setRole] = (0, import_react.useState)("editor");
	const add = useMutation({
		mutationFn: addMemberFn,
		onSuccess: () => {
			toast.success("User added");
			setEmail("");
			setName("");
			setPassword("");
			qc.invalidateQueries({ queryKey: ["members"] });
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Could not add user")
	});
	const roleMut = useMutation({
		mutationFn: setMemberRoleFn,
		onSuccess: () => {
			toast.success("Role updated");
			qc.invalidateQueries({ queryKey: ["members"] });
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Could not change role")
	});
	const remove = useMutation({
		mutationFn: (userId) => removeMemberFn({ data: userId }),
		onSuccess: () => {
			toast.success("User removed");
			qc.invalidateQueries({ queryKey: ["members"] });
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Could not remove")
	});
	const passwd = useMutation({
		mutationFn: setMemberPasswordFn,
		onSuccess: () => toast.success("Password set"),
		onError: (err) => toast.error(err instanceof Error ? err.message : "Could not set password")
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Users"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted",
				children: [
					"Only established members can open the dashboard. Add people here or with",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
						className: "font-mono text-fg",
						children: "pulsectl user add"
					}),
					" on the host."
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-4 text-sm font-medium",
					children: "Add user"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "grid gap-3 sm:grid-cols-2",
					onSubmit: (e) => {
						e.preventDefault();
						add.mutate({ data: {
							email,
							name,
							password: password || void 0,
							role
						} });
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								required: true,
								type: "email",
								value: email,
								onChange: (e) => setEmail(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: name,
								onChange: (e) => setName(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Password (required for new accounts)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "password",
								minLength: 8,
								value: password,
								onChange: (e) => setPassword(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Role" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "h-10 rounded-md border border-border bg-bg px-3 text-sm",
								value: role,
								onChange: (e) => setRole(e.target.value),
								children: ROLES.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: r,
									children: r
								}, r))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sm:col-span-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: add.isPending,
								children: add.isPending ? "Adding…" : "Add user"
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "border-b border-border text-xs text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "User"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Role"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Login"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-4 py-3 font-medium" })
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (members.data ?? []).map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: u.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-mono text-xs text-subtle",
									children: u.email
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: u.role === "owner" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-accent",
									children: "owner"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									className: "h-9 rounded-md border border-border bg-bg px-2",
									value: u.role,
									onChange: (e) => roleMut.mutate({ data: {
										userId: u.userId,
										role: e.target.value
									} }),
									children: ROLES.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: r,
										children: r
									}, r))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-muted",
								children: u.hasPassword ? "password" : "sso"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-right",
								children: u.role !== "owner" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-end gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "secondary",
										onClick: () => {
											const next = window.prompt(`New password for ${u.email}`);
											if (next) passwd.mutate({ data: {
												userId: u.userId,
												password: next
											} });
										},
										children: "Password"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										onClick: () => {
											if (window.confirm(`Remove ${u.email} from Pulsewatch?`)) remove.mutate(u.userId);
										},
										children: "Remove"
									})]
								})
							})
						]
					}, u.userId)) })]
				})
			})
		]
	});
}
//#endregion
export { UsersPage as component };
