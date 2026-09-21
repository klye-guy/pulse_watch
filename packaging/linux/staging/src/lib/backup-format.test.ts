import assert from "node:assert/strict";
import { test } from "node:test";
import { backupFilename, parseBackup } from "./backup-format.ts";

test("parseBackup accepts a full v1 file and normalizes users", () => {
  const parsed = parseBackup({
    kind: "pulsewatch.backup",
    version: 1,
    exportedAt: "2026-01-02T03:04:05.000Z",
    site: { name: "Ops" },
    users: [
      { email: "Ada@Example.com", name: "Ada", role: "admin", passwordHash: "hash" },
      { email: "not-an-email", name: "Skip", role: "viewer" },
    ],
    channels: [{ id: "c1", name: "Hook", type: "email", config: { host: "smtp.example", to: "ops@example.com" }, active: true }],
    monitors: [
      {
        id: "m1",
        name: "API",
        type: "http",
        url: "https://api.example",
        method: "GET",
        intervalSec: 60,
        timeoutSec: 16,
        acceptedStatus: "200-299",
        tags: "prod",
        active: true,
        channelIds: ["c1"],
      },
    ],
    statusPages: [{ id: "p1", slug: "Public Status", title: "Public", description: "", published: true, monitorIds: ["m1"] }],
  });
  assert.equal(parsed.site.name, "Ops");
  assert.equal(parsed.users.length, 1);
  assert.equal(parsed.users[0].email, "ada@example.com");
  assert.equal(parsed.statusPages[0].slug, "public-status");
  assert.equal(parsed.monitors[0].channelIds[0], "c1");
});

test("parseBackup rejects unknown kinds and versions", () => {
  assert.throws(() => parseBackup({ kind: "other", version: 1 }), /Not a Pulsewatch backup file/);
  assert.throws(
    () => parseBackup({ kind: "pulsewatch.backup", version: 99 }),
    /Unsupported backup version/,
  );
});

test("backupFilename uses a filesystem-safe stamp", () => {
  assert.equal(backupFilename("2026-09-19T15:30:00.000Z"), "pulsewatch-backup-2026-09-19-15-30-00.json");
});
