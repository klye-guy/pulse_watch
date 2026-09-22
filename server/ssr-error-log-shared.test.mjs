import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isNoResponseRouteError,
  logSsrRouteError,
  markSsrErrorLogged,
  wasSsrErrorLogged,
  walkCauseChain,
} from "./ssr-error-log-shared.mjs";

test("walkCauseChain walks nested Error.cause messages", () => {
  const root = new Error("outer");
  const mid = new Error("mid");
  const leaf = new Error("leaf");
  mid.cause = leaf;
  root.cause = mid;
  assert.deepEqual(walkCauseChain(root), ["Error: outer", "Error: mid", "Error: leaf"]);
});

test("walkCauseChain breaks cycles", () => {
  const a = new Error("a");
  const b = new Error("b");
  a.cause = b;
  b.cause = a;
  assert.deepEqual(walkCauseChain(a), ["Error: a", "Error: b"]);
});

test("isNoResponseRouteError matches TanStack throwRouteHandlerError stacks", () => {
  const err = new Error("Internal Server Error");
  err.stack = `Error: Internal Server Error
    at throwRouteHandlerError (file:///opt/pulsewatch/.output/server/_ssr/ssr.mjs:1537:8)
    at getFinalResponse (file:///opt/pulsewatch/.output/server/_ssr/ssr.mjs:1601:18)`;
  assert.equal(isNoResponseRouteError(err), true);
});

test("isNoResponseRouteError matches explicit TanStack no-response message", () => {
  const err = new Error(
    "It looks like you forgot to return a response from your server route handler. If you want to defer to the app router, make sure to have a component set in this route.",
  );
  assert.equal(isNoResponseRouteError(err), true);
});

test("isNoResponseRouteError does not treat a generic ISE as no-Response", () => {
  const err = new Error("Internal Server Error");
  err.stack = `Error: Internal Server Error
    at someAppHandler (file:///opt/pulsewatch/.output/server/index.mjs:10:1)`;
  assert.equal(isNoResponseRouteError(err), false);
});

test("isNoResponseRouteError checks cause stack frames", () => {
  const cause = new Error("Internal Server Error");
  cause.stack = `Error: Internal Server Error\n    at throwRouteHandlerError (ssr.mjs:1:1)`;
  const err = new Error("Internal Server Error");
  err.cause = cause;
  assert.equal(isNoResponseRouteError(err), true);
});

test("logSsrRouteError dedupes via SSR_ERROR_LOGGED mark", () => {
  const lines = [];
  const original = console.error;
  console.error = (...args) => {
    lines.push(String(args[0]));
  };
  try {
    const err = new Error("boom");
    logSsrRouteError({ method: "GET", path: "/x" }, err, "t");
    logSsrRouteError({ method: "GET", path: "/x" }, err, "t");
    assert.equal(lines.length, 1);
    assert.equal(wasSsrErrorLogged(err), true);
    const parsed = JSON.parse(lines[0]);
    assert.equal(parsed.path, "/x");
    assert.equal(parsed.tag, "t");
  } finally {
    console.error = original;
  }
});

test("markSsrErrorLogged is idempotent for second logger", () => {
  const err = new Error("once");
  markSsrErrorLogged(err);
  assert.equal(wasSsrErrorLogged(err), true);
});
