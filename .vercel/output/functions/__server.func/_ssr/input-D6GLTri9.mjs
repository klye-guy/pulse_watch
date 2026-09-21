import "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { t as cn } from "./utils-DcJqOWe7.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
require_react();
var import_jsx_runtime = require_jsx_runtime();
function Input({ className, type, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg", "placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60", "disabled:cursor-not-allowed disabled:opacity-50", className),
		...props
	});
}
//#endregion
export { Input as t };
