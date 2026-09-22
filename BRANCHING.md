# Branching workflow

## Branches

- **`main`** — production-ready code only. No direct pushes. Updates land via pull request when a release is ready (typically from `development`, or from a short-lived `release/*` branch).
- **`development`** — all ongoing feature and fix work. Day-to-day commits and open PRs target this branch.

## How to ship

1. Branch from `development` (`feature/…`, `fix/…`).
2. Open a PR into `development` for review and soak/QA.
3. When `development` is production-ready, open a PR into `main` and merge only after sign-off.
4. Tag the release on `main` (for example `v1.0.0`) and build packages from that tip.

## Rules of thumb

- Do not push commits straight to `main`.
- Do not pile packaging iterations or half-finished fixes onto `main`; keep them on `development` until ready.
- Delete feature branches after they merge into `development`.
