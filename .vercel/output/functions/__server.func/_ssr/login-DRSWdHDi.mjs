import { o as __toESM } from "../_runtime.mjs";
import { t as GROK_PROVIDERS } from "./server-B1-RZC3i.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { authClient, signIn } from "./client-B0AjNB7w.mjs";
import { y as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { n as useCurrentUserState } from "./use-current-user-XyOtnNUM.mjs";
import { t as Button } from "./button-GlTFQgya.mjs";
import { g as Activity } from "../_libs/lucide-react.mjs";
import { t as Input } from "./input-D6GLTri9.mjs";
import { i as Route$10 } from "./router-Bh34F-X0.mjs";
import { t as Label } from "./label-Bfr74K1a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-DRSWdHDi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const { user, isPending } = useCurrentUserState();
	const needsSetup = Route$10.useLoaderData().needsSetup;
	const [mode, setMode] = (0, import_react.useState)(needsSetup ? "setup" : "signin");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	if (!isPending && user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	async function onSubmit(e) {
		e.preventDefault();
		setError(null);
		setBusy(true);
		try {
			if (mode === "setup") {
				const { error: err } = await authClient.signUp.email({
					email,
					password,
					name: name.trim() || email.split("@")[0] || "Owner",
					callbackURL: "/"
				});
				if (err) throw new Error(err.message ?? "Could not create the owner account");
			} else {
				const { error: err } = await authClient.signIn.email({
					email,
					password,
					callbackURL: "/"
				});
				if (err) throw new Error(err.message ?? "Invalid email or password");
			}
			window.location.href = "/";
		} catch (err) {
			setError(err instanceof Error ? err.message : "Sign-in failed");
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative grid min-h-screen place-items-center overflow-hidden bg-bg px-4 py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			"aria-hidden": "true",
			className: "pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-accent)_8%,transparent),transparent)]"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative w-full max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-8 flex flex-col items-center text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-4 grid size-12 place-items-center rounded-lg bg-surface text-accent shadow-[var(--shadow-border)]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-6" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-2xl font-semibold tracking-tight",
							children: "Pulsewatch"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-sm text-sm text-muted",
							children: mode === "setup" ? "Create the owner account. After this, only established users can open the dashboard." : "Sign in with an established account. New users are added by an administrator."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "space-y-3",
						onSubmit,
						children: [
							mode === "setup" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: name,
									onChange: (e) => setName(e.target.value),
									placeholder: "Ada Lovelace"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "email",
									required: true,
									autoComplete: "username",
									value: email,
									onChange: (e) => setEmail(e.target.value),
									placeholder: "you@company.com"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Password" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "password",
									required: true,
									minLength: 8,
									autoComplete: mode === "setup" ? "new-password" : "current-password",
									value: password,
									onChange: (e) => setPassword(e.target.value)
								})]
							}),
							error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-down",
								children: error
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "w-full",
								type: "submit",
								disabled: busy || false,
								children: busy ? "Please wait…" : mode === "setup" ? "Create owner account" : "Sign in"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex items-center gap-3 text-xs text-subtle",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" }),
								"or continue with",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" })
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid gap-2",
							children: GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "secondary",
								className: "w-full",
								onClick: () => signIn(p.providerId, { callbackURL: "/" }),
								children: ["Continue with ", p.label]
							}, p.providerId))
						})]
					})]
				}),
				needsSetup ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-center text-xs text-subtle",
					children: ["Fresh install — this first account becomes the owner.", mode === "setup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						" ",
						"Already have an account?",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "underline",
							onClick: () => setMode("signin"),
							children: "Sign in"
						})
					] }) : null]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-center text-xs text-subtle",
					children: [
						"Need an account? Ask an owner to add you in Users, or run",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "font-mono text-muted",
							children: "pulsectl user add"
						}),
						"."
					]
				})
			]
		})]
	});
}
//#endregion
export { Login as component };
