import assert from "node:assert/strict";
import test from "node:test";
import { extractClaims } from "../lib/claims.ts";

test("generic swap wording does not imply Uniswap or X Layer", async () => {
  const claims = await extractClaims("Built a swap bot with 3 transactions and no chain specified.");

  assert.equal(claims.uniswapUsed, false);
  assert.equal(claims.deploymentChain, null);
  assert.equal(claims.transactionCount, 3);
});

test("explicit OnchainOS and X Layer mentions are preserved", async () => {
  const claims = await extractClaims("OnchainOS agent running on X Layer with Uniswap routing.");

  assert.equal(claims.onchainosUsed, true);
  assert.equal(claims.uniswapUsed, true);
  assert.equal(claims.deploymentChain, "X Layer");
});
