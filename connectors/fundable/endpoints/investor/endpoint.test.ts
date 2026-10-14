import { assertEquals, assertRejects } from "@std/assert";
import { fromFileUrl } from "@std/path";
import {
    liveSkip,
    loadFixture,
    runEndpoint,
    testSealedUnit,
} from "@shared/testing";

const fixturesDir = fromFileUrl(new URL("./fixtures/", import.meta.url));
const ID = "fundable#investor";

Deno.test("fundable#investor happy (synthetic): flat 1 credit; meter absorbed", async () => {
    const unit = await testSealedUnit(ID);
    const fixture = await loadFixture(`${fixturesDir}synthetic-happy.json`);
    const result = await runEndpoint({
        unit,
        // the fixture URL proves the wire form
        input: { queryParams: { domain: "sequoiacap.com" } },
        mode: "replay",
        fixture,
    });
    assertEquals(result.httpStatus, 200);
    // flat model: the engine appends the CALL line; the vendor's own 1
    // credit is the claim and agrees with the pinned draw
    assertEquals(result.usage, {
        credits: { default: 1 },
        evidence: { CALL: 1 },
    });
    const output = result.output as Record<string, Record<string, unknown>>;
    assertEquals(
        (output.data.investor as Record<string, unknown>).name,
        "Sequoia Capital",
    );
    // credits_used was the only meta key — pluck leaves an empty meta
    assertEquals(output.meta, {});
});

Deno.test("fundable#investor provider error (synthetic 404): data, zero usage", async () => {
    const unit = await testSealedUnit(ID);
    const fixture = await loadFixture(
        `${fixturesDir}synthetic-provider-error.json`,
    );
    const result = await runEndpoint({
        unit,
        input: { queryParams: { domain: "nonexistent-xyz.com" } },
        mode: "replay",
        fixture,
    });
    assertEquals(result.httpStatus, 404);
    assertEquals(result.isProviderError, true);
    assertEquals(result.usage, { credits: {}, evidence: {} });
    assertEquals(
        (result.output as Record<string, Record<string, unknown>>).error.code,
        "INVESTOR_NOT_FOUND",
    );
});

Deno.test("fundable#investor: a non-UUID id is rejected before the wire", async () => {
    const unit = await testSealedUnit(ID);
    const fixture = await loadFixture(`${fixturesDir}synthetic-happy.json`);
    await assertRejects(
        () =>
            runEndpoint({
                unit,
                input: { queryParams: { id: "not-a-uuid" } },
                mode: "replay",
                fixture,
            }),
        Error,
        "INVALID_INPUT",
    );
});

Deno.test({
    name: "fundable#investor live (gated on FUNDABLE_API_KEY)",
    ignore: liveSkip("fundable"),
    fn: async () => {
        const unit = await testSealedUnit(ID);
        const result = await runEndpoint({
            unit,
            input: { queryParams: { domain: "sequoiacap.com" } },
            mode: "live",
        });
        assertEquals(
            result.isProviderError,
            false,
            JSON.stringify(result.output),
        );
        assertEquals(result.usage.evidence, { CALL: 1 });
    },
});
