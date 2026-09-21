import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { S as savePageFn, _ as listPagesFn, a as deletePageFn, h as listMonitorsFn } from "./fns-BD1qJbCk.mjs";
import { t as Button } from "./button-GlTFQgya.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as Input } from "./input-D6GLTri9.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-Bfr74K1a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status-pages-BvyoOZ8g.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StatusPages() {
	const qc = useQueryClient();
	const pages = useQuery({
		queryKey: ["pages"],
		queryFn: () => listPagesFn()
	});
	const monitors = useQuery({
		queryKey: ["monitors"],
		queryFn: () => listMonitorsFn()
	});
	const [title, setTitle] = (0, import_react.useState)("Service status");
	const [slug, setSlug] = (0, import_react.useState)("public");
	const [description, setDescription] = (0, import_react.useState)("");
	const [selected, setSelected] = (0, import_react.useState)([]);
	const save = useMutation({
		mutationFn: savePageFn,
		onSuccess: () => {
			toast.success("Status page saved");
			qc.invalidateQueries({ queryKey: ["pages"] });
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save")
	});
	const remove = useMutation({
		mutationFn: (id) => deletePageFn({ data: id }),
		onSuccess: () => {
			toast.success("Removed");
			qc.invalidateQueries({ queryKey: ["pages"] });
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Status pages"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "Public pages do not require a login. The dashboard itself stays private."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-4 text-sm font-medium",
					children: "Create page"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "grid gap-3",
					onSubmit: (e) => {
						e.preventDefault();
						save.mutate({ data: {
							title,
							slug,
							description,
							published: true,
							monitorIds: selected
						} });
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-3 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Title" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									required: true,
									value: title,
									onChange: (e) => setTitle(e.target.value)
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Slug" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									required: true,
									value: slug,
									onChange: (e) => setSlug(e.target.value)
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Description" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: description,
								onChange: (e) => setDescription(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Monitors" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid gap-1 sm:grid-cols-2",
								children: (monitors.data ?? []).map((m) => {
									const on = selected.includes(m.id);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex h-10 items-center gap-2 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											className: "size-4 accent-accent",
											checked: on,
											onChange: () => setSelected((cur) => on ? cur.filter((id) => id !== m.id) : [...cur, m.id])
										}), m.name]
									}, m.id);
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: save.isPending,
							children: "Publish page"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "space-y-2",
				children: (pages.data ?? []).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: p.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono text-xs text-subtle",
						children: ["/s/", p.slug]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "secondary",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/s/$slug",
								params: { slug: p.slug },
								children: "Open"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							onClick: () => remove.mutate(p.id),
							children: "Delete"
						})]
					})]
				}, p.id))
			})
		]
	});
}
//#endregion
export { StatusPages as component };
