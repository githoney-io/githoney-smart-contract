import { describe, expect, it } from "@jest/globals";
import { OutRef } from "@spacebudz/lucid";
import {
  newAssign,
  newBounty,
  newClose,
  newMerge,
  signSubmitAndWaitConfirmation,
} from "../utils.ts";
import { claimBounty } from "../../operations/index.ts";
import { logger, lucidBase as lucid } from "../../utils/utils.ts";
import { contributorSeed, settingsRef } from "../../constants.ts";

describe("Claim tests", () => {
  it("Claim bounty", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    const createTxId = await newBounty(lucid, settingsUtxo);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const mergeTxId = await newMerge(lucid, assignOutRef, settingsUtxo);
    const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

    const { claimCbor } = await claimBounty(settingsUtxo, mergeOutRef);
    lucid.selectWalletFromSeed(contributorSeed);
    await signSubmitAndWaitConfirmation(claimCbor, lucid);
  }, 300000);
  it("Claim bounty after close", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      const closeTxId = await newClose(lucid, assignOutRef, settingsUtxo);
      const closeOutRef: OutRef = { txHash: closeTxId, outputIndex: 0 };

      const { claimCbor } = await claimBounty(settingsUtxo, closeOutRef);
      lucid.selectWalletFromSeed(contributorSeed);
      await signSubmitAndWaitConfirmation(claimCbor, lucid);
    } catch (e) {
      const error = e as Error;
      console.error(error);
      logger.error(error.message);
      expect(error.message).toBe("This UTxO does not have a datum hash.");
    }
  }, 300000);
  it("Claim bounty not merged", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      await claimBounty(settingsUtxo, assignOutRef);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toBe("Bounty is not merged");
    }
  }, 300000);
  it("Claim bounty with no contributor", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      await claimBounty(settingsUtxo, createOutRef);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toBe("Bounty doesn't have a contributor");
    }
  }, 300000);
});
