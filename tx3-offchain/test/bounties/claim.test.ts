import { describe, expect, it } from "@jest/globals";
import { OutRef } from "@spacebudz/lucid";
import {
  logger,
  newAssign,
  newBounty,
  newClose,
  newMerge,
  waitForUtxosUpdate,
} from "../utils.ts";
import { claimBounty } from "../../operations/index.ts";
import { lucidBase as lucid, signAndSubmit } from "../../utils/utils.ts";
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
    const txId = await signAndSubmit(claimCbor, lucid);
    waitForUtxosUpdate(lucid, txId);
  });

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
      const txId = await signAndSubmit(claimCbor, lucid);
      waitForUtxosUpdate(lucid, txId);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toBe("This Utxo does not have a datum hash.");
    }
  });

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
  });

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
  });
});
