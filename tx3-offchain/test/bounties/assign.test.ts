import { describe, expect, it } from "@jest/globals";
import {
  newBounty,
  newMerge,
  signSubmitAndWaitConfirmation,
} from "../utils.ts";
import { assignContributor } from "../../operations/index.ts";
import { logger, lucidBase as lucid } from "../../utils/utils.ts";
import {
  adminAddr,
  contributorAddr,
  contributorSeed,
  settingsRef,
} from "../../constants.ts";
import { OutRef } from "@spacebudz/lucid";

describe("Assign Contributor tests", () => {
  it("Assign Contributor", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    const createTxId = await newBounty(lucid, settingsUtxo);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };
    const { assignCbor } = await assignContributor(
      contributorAddr,
      settingsUtxo,
      createOutRef,
    );
    lucid.selectWalletFromSeed(contributorSeed);
    await signSubmitAndWaitConfirmation(assignCbor, lucid);
  }, 300000);
  it("Assign Contributor with already merged bounty", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };
      const { assignCbor } = await assignContributor(
        contributorAddr,
        settingsUtxo,
        createOutRef,
      );
      lucid.selectWalletFromSeed(contributorSeed);
      const assignTxHash = await signSubmitAndWaitConfirmation(
        assignCbor,
        lucid,
      );
      const assignOutRef: OutRef = { txHash: assignTxHash, outputIndex: 0 };

      const mergeTxId = await newMerge(lucid, assignOutRef, settingsUtxo);
      const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

      await assignContributor(contributorAddr, settingsUtxo, mergeOutRef);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toBe("Bounty already merged");
    }
  }, 300000);
  it("Assign Contributor with contributor already assigned", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };
      // Assign contributor
      const { assignCbor } = await assignContributor(
        contributorAddr,
        settingsUtxo,
        createOutRef,
      );
      lucid.selectWalletFromSeed(contributorSeed);
      const assignTxHash = await signSubmitAndWaitConfirmation(
        assignCbor,
        lucid,
      );
      const assignOutRef: OutRef = { txHash: assignTxHash, outputIndex: 0 };
      // Try to assign different contributor (this should fail)
      await assignContributor(adminAddr, settingsUtxo, assignOutRef);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toBe("Bounty already has a contributor");
    }
  }, 300000);
});
