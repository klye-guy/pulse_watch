import { o as __toESM } from "./_runtime.mjs";
import { a as hasGateSessionMarker } from "./_ssr/server-B1-RZC3i.mjs";
import { n as require_react } from "./_libs/@radix-ui/react-compose-refs+[...].mjs";
import { signOut } from "./_ssr/client-B0AjNB7w.mjs";
import { t as cn } from "./_ssr/utils-DcJqOWe7.mjs";
import { d as useRouterState, m as Outlet, v as Link, y as Navigate } from "./_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "./_libs/radix-ui__react-context+react.mjs";
import { i as DialogPortal, n as DialogContent, r as DialogOverlay, t as Dialog } from "./_libs/@radix-ui/react-dialog+[...].mjs";
import { s as getAccessState } from "./_ssr/fns-BD1qJbCk.mjs";
import { n as useCurrentUserState, t as useCurrentUser } from "./_ssr/use-current-user-XyOtnNUM.mjs";
import { t as Button } from "./_ssr/button-GlTFQgya.mjs";
import { a as ShieldOff, c as Radio, f as Menu, g as Activity, h as Bell, l as Plus, m as Download, o as Settings, p as LayoutGrid, t as Users } from "./_libs/lucide-react.mjs";
import { n as useQuery } from "./_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_app-BzfCYGhK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* With auth on, visitors are signed out until they authenticate — in the sandbox
* live preview too, which does real sign-in. The shared dev user appears only
* when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to });
}
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const gateSession = (0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			!gateSession && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
var Sheet = Dialog;
function SheetContent({ className, children, side = "left", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-50 bg-bg/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
		className: cn("fixed z-50 flex h-full w-72 flex-col bg-surface p-4 shadow-[var(--shadow-border)]", side === "left" ? "inset-y-0 left-0" : "inset-y-0 right-0", className),
		...props,
		children
	})] });
}
var NAV = [
	{
		to: "/",
		label: "Dashboard",
		icon: LayoutGrid,
		min: "viewer"
	},
	{
		to: "/monitors/new",
		label: "New monitor",
		icon: Plus,
		min: "editor"
	},
	{
		to: "/status-pages",
		label: "Status pages",
		icon: Radio,
		min: "viewer"
	},
	{
		to: "/notifications",
		label: "Notifications",
		icon: Bell,
		min: "viewer"
	},
	{
		to: "/users",
		label: "Users",
		icon: Users,
		min: "admin"
	},
	{
		to: "/settings",
		label: "Settings",
		icon: Settings,
		min: "viewer"
	},
	{
		to: "/install",
		label: "Install",
		icon: Download,
		min: "admin"
	}
];
var RANK = {
	viewer: 0,
	editor: 1,
	admin: 2,
	owner: 3
};
function AppShell({ children, role }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const user = useCurrentUser();
	const [open, setOpen] = (0, import_react.useState)(false);
	const items = NAV.filter((item) => RANK[role] >= RANK[item.min]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavList, {
						items,
						pathname
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-auto border-t border-border p-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 flex-1 flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex h-14 items-center gap-3 border-b border-border px-4 md:hidden",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							onClick: () => setOpen(true),
							"aria-label": "Open menu",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							className: "flex items-center gap-2 font-medium",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-4 text-accent" }), "Pulsewatch"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "ml-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "flex-1 px-4 py-5 md:px-8 md:py-7",
					children
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open,
				onOpenChange: setOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavList, {
						items,
						pathname,
						onNavigate: () => setOpen(false)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-auto px-2 text-xs text-subtle",
						children: user?.primaryEmail
					})
				] })
			})
		]
	});
}
function Brand() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/",
		className: "flex items-center gap-2.5 px-4 py-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "grid size-8 place-items-center rounded-md bg-elevated text-accent shadow-[var(--shadow-border)]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-4" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm font-semibold tracking-tight",
			children: "Pulsewatch"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-xs text-subtle",
			children: "Private monitoring"
		})] })]
	});
}
function NavList({ items, pathname, onNavigate }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "flex flex-col gap-0.5 px-2",
		children: items.map((item) => {
			const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
			const Icon = item.icon;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: item.to,
				onClick: onNavigate,
				className: cn("flex h-10 items-center gap-2.5 rounded-md px-3 text-sm transition-colors duration-150", active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/70 hover:text-fg"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), item.label]
			}, item.to);
		})
	});
}
function AuthedLayout() {
	const { user, isPending } = useCurrentUserState();
	const access = useQuery({
		queryKey: ["access", user?.id],
		queryFn: () => getAccessState(),
		enabled: Boolean(user)
	});
	if (isPending && !user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShellSkeleton, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (user && access.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShellSkeleton, {});
	if (access.data?.status === "denied") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-screen place-items-center bg-bg px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-xl bg-surface p-6 text-center shadow-[var(--shadow-border)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldOff, { className: "mx-auto mb-3 size-8 text-muted" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-lg font-medium",
					children: "Access not granted"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm text-muted",
					children: [
						"You are signed in as ",
						access.data.email ?? "this account",
						", but an administrator has not added you to Pulsewatch yet."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-5",
					variant: "secondary",
					onClick: () => void signOut("/login"),
					children: "Sign out"
				})
			]
		})
	});
	if (access.data?.status !== "ok") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShellSkeleton, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		role: access.data.role,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
	});
}
function ShellSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen bg-bg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hidden w-60 border-r border-border bg-surface md:block" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-lg font-medium",
					children: "Pulsewatch"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Loading dashboard…"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-6 h-40 animate-pulse rounded-xl bg-surface" })
			]
		})]
	});
}
//#endregion
export { AuthedLayout as component };
