/**
 * TypeScript façade over the shared SSR error logger (.mjs) so Vite/Nitro
 * middleware can import typed helpers without duplicating logic.
 */
export {
  SSR_ERROR_LOGGED,
  walkCauseChain,
  isNoResponseRouteError,
  markSsrErrorLogged,
  wasSsrErrorLogged,
  logSsrRouteError,
} from "./ssr-error-log-shared.mjs";
