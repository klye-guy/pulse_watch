import "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { t as cn } from "./utils-DcJqOWe7.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
require_react();
var import_jsx_runtime = require_jsx_runtime();
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: cn("text-xs font-medium tracking-wide text-muted", className),
		...props
	});
}
//#endregion
export { Label as t };
