import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { redactSecrets } from "../src/lib/server/channel-redact.mjs";

describe("redactSecrets", () => {
  it("redacts discord/slack/webhook urls", () => {
    const url = "https://hooks.slack.com/services/T00/B00/secretvalue";
    for (const type of ["discord", "slack", "webhook"]) {
      const out = redactSecrets(type, { url, room: "ops" });
      assert.notEqual(out.url, url);
      assert.ok(out.url.includes("…") || out.url === "");
      assert.equal(out.room, "ops");
    }
  });

  it("still redacts telegram tokens and email pass", () => {
    const tg = redactSecrets("telegram", { token: "123456:ABCDEF" });
    assert.notEqual(tg.token, "123456:ABCDEF");
    const em = redactSecrets("email", { pass: "hunter2", user: "a" });
    assert.equal(em.pass, "");
    assert.equal(em.user, "a");
  });
});
