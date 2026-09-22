/**
 * Local email/password sign-in (this app's Better Auth DB — not the broker).
 *
 * Off by default in the App Builder template. Pulsewatch enables it for
 * self-host sign-in. Public sign-up stays closed (`disableSignUp: true` in
 * `server.ts`); create the first owner with `pulsectl user add`, then add
 * further users from the dashboard or CLI.
 *
 * Do NOT edit `server.ts` for the enable flag — flip `emailAndPasswordEnabled`
 * here only (see auth skill).
 */
export const emailAndPasswordEnabled = true;
