import { describe, it } from "mocha";
import {
  emulator,
  ACCOUNT_CONTRIBUTOR,
  ACCOUNT_0,
  lucid
} from "../emulatorConfig";
import { OutRef } from "lucid-cardano";
import { expect } from "chai";
import { claimBounty } from "../../src/operations/bounties/claim";
import {
  deployUtxo,
  newAssign,
  newBounty,
  newClose,
  newMerge,
  signAndSubmit
} from "../utils";
import logger from "../../src/logger";

describe("Claim tests", async () => {
  it("Claim bounty", async () => {
    const { settingsUtxo } = await deployUtxo(lucid);
    const createTxId = await newBounty(lucid, settingsUtxo);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const mergeTxId = await newMerge(lucid, assignOutRef, settingsUtxo);
    const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

    const claimTx = await claimBounty(settingsUtxo, mergeOutRef, lucid);
    emulator.awaitBlock(3);
    lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
    await signAndSubmit(lucid, claimTx);
  });

  it("Claim bounty after close", async () => {
    const { settingsUtxo } = await deployUtxo(lucid);
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      const closeTxId = await newClose(lucid, assignOutRef, settingsUtxo);
      const closeOutRef: OutRef = { txHash: closeTxId, outputIndex: 0 };

      const claimTx = await claimBounty(settingsUtxo, closeOutRef, lucid);
      emulator.awaitBlock(3);
      lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
      await signAndSubmit(lucid, claimTx);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).to.equal("This UTxO does not have a datum hash.");
    }
  });

  it("Claim bounty not merged", async () => {
    const { settingsUtxo } = await deployUtxo(lucid);
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      await claimBounty(settingsUtxo, assignOutRef, lucid);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).to.equal("Bounty is not merged");
    }
  });

  it("Claim bounty with no contributor", async () => {
    const { settingsUtxo } = await deployUtxo(lucid);
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      await claimBounty(settingsUtxo, createOutRef, lucid);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).to.equal("Bounty doesn't have a contributor");
    }
  });
});
