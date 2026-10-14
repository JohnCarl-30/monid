import { assertEquals } from "@std/assert";
import { fromFileUrl } from "@std/path";
import {
    liveSkip,
    loadFixture,
    runEndpoint,
    testSealedUnit,
} from "@shared/testing";

const fixturesDir = fromFileUrl(new URL("./fixtures/", import.meta.url));
const ID = "fundable#person/search";

Deno.test("fundable#person/search happy (synthetic): the flat 0.1-credit search fee; meter absorbed", async () => {
    const unit = await testSealedUnit(ID);
    const fixture = await loadFixture(`${fixturesDir}synthetic-happy.json`);
    const result = await runEndpoint({
        unit,
        input: { queryParams: { name: "jane example" } },
        mode: "replay",
        fixture,
    });
    assertEquals(result.httpStatus, 200);
    assertEquals(result.isProviderError, false);
    // the ONE credit system (rate card: searches 0.1 credit/call): the
    // vendor's own 0.1 stamp matches the doc's 0.1 fold — no mismatch
    assertEquals(result.usage, {
        credits: { default: 0.1 },
        evidence: { CALL: 1 },
    });
    const output = result.output as Record<string, Record<string, unknown>>;
    assertEquals((output.data.people as unknown[]).length, 1);
    assertEquals(output.meta, { total_count: 1 });
});

Deno.test("fundable#person/search empty (synthetic): zero candidates still bill the 0.1-credit search", async () => {
    const unit = await testSealedUnit(ID);
    const fixture = await loadFixture(`${fixturesDir}synthetic-empty.json`);
    const result = await runEndpoint({
        unit,
        input: { queryParams: { name: "zzzz-no-such-person" } },
        mode: "replay",
        fixture,
    });
    assertEquals(result.httpStatus, 200);
    assertEquals(result.usage, {
        credits: { default: 0.1 },
        evidence: { CALL: 1 },
    });
});

Deno.test({
    name: "fundable#person/search live (gated on FUNDABLE_API_KEY)",
    ignore: liveSkip("fundable"),
    fn: async () => {
        const unit = await testSealedUnit(ID);
        const result = await runEndpoint({
            unit,
            input: { queryParams: { name: "reid hoffman" } },
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
