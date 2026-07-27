import assert from "node:assert/strict";
import test from "node:test";
import {
  checkDatabaseHealth,
  createUuidV7,
  databaseHealthQuery,
  isUuidV7,
  withTransaction
} from "../packages/database/dist/index.js";

test("UUIDv7 identifiers are canonical, time-sortable, and reject unsafe timestamps", () => {
  const first = createUuidV7(1_700_000_000_000);
  const second = createUuidV7(1_700_000_000_001);

  assert.equal(isUuidV7(first), true);
  assert.equal(isUuidV7(second), true);
  assert.equal(first[14], "7");
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
  assert.equal(first < second, true);
  assert.throws(() => createUuidV7(-1), RangeError);
  assert.equal(isUuidV7("00000000-0000-4000-8000-000000000000"), false);
});

test("database health uses the stable SELECT 1 query and does not expose errors", async () => {
  let executedQuery;
  const healthy = await checkDatabaseHealth({
    query: async (text) => {
      executedQuery = text;
      return { rows: [{ health_check: 1 }] };
    }
  });
  assert.equal(executedQuery, databaseHealthQuery);
  assert.equal(healthy.healthy, true);

  const unhealthy = await checkDatabaseHealth({
    query: async () => Promise.reject(new Error("password=do-not-return"))
  });
  assert.equal(unhealthy.healthy, false);
});

test("transaction helper commits, rolls back, and always releases the client", async () => {
  const committedEvents = [];
  const committedClient = {
    query: async (text) => {
      committedEvents.push(text);
      return { rows: [] };
    },
    release: () => committedEvents.push("RELEASE")
  };
  const committed = await withTransaction(
    { connect: async () => committedClient },
    async (client) => {
      await client.query("SELECT 1");
      return "committed";
    }
  );
  assert.equal(committed, "committed");
  assert.deepEqual(committedEvents, ["BEGIN", "SELECT 1", "COMMIT", "RELEASE"]);

  const rolledBackEvents = [];
  const rolledBackClient = {
    query: async (text) => {
      rolledBackEvents.push(text);
      return { rows: [] };
    },
    release: () => rolledBackEvents.push("RELEASE")
  };
  await assert.rejects(
    withTransaction({ connect: async () => rolledBackClient }, async () => {
      throw new Error("operation failed");
    }),
    /operation failed/u
  );
  assert.deepEqual(rolledBackEvents, ["BEGIN", "ROLLBACK", "RELEASE"]);
});

test("transaction helper reports an unconfirmed rollback without leaking driver details", async () => {
  const client = {
    query: async (text) => {
      if (text === "ROLLBACK") {
        throw new Error("password=do-not-return");
      }
      return { rows: [] };
    },
    release: () => undefined
  };

  await assert.rejects(
    withTransaction({ connect: async () => client }, async () => {
      throw new Error("operation failed");
    }),
    (error) => {
      assert.equal(
        error.message,
        "Database transaction failed and rollback could not be confirmed."
      );
      assert.doesNotMatch(error.message, /password=do-not-return/u);
      return true;
    }
  );
});
