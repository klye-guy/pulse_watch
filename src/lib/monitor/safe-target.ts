/**
 * SSRF / unsafe-target guards for monitor checks (Kevin AppSec #3, #6).
 * Implementation lives in `./safe-target.mjs` so Node tests can import it
 * without TypeScript strip-types.
 */
export {
  UnsafeTargetError,
  privateTargetsAllowed,
  isDangerousHostnameArg,
  isPrivateOrReservedIp,
  assertSafeHostnameSyntax,
  assertSafeHostname,
  assertSafeHttpUrl,
  assertSafeTargetInput,
} from "./safe-target.mjs";
