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

describe("channel url preserve on upsert (redacted/empty)", () => {
  it("treats empty or ellipsis-redacted urls as keep-previous", () => {
    const prev = "https://hooks.slack.com/services/T00/B00/secretvalue";
    const redacted = redactSecrets("slack", { url: prev }).url;
    function shouldPreserve(posted) {
      return !posted || posted.includes("…");
    }
    assert.equal(shouldPreserve(""), true);
    assert.equal(shouldPreserve(undefined), true);
    assert.equal(shouldPreserve(redacted), true);
    assert.equal(shouldPreserve(prev), false);
    assert.equal(shouldPreserve("https://example.com/hook"), false);
  });
});
