import { describe, it } from "mocha";
import { emulator, ACCOUNT_CONTRIBUTOR, ACCOUNT_0 } from "./emulatorConfig";
import { Lucid, OutRef } from "lucid-cardano";
import { expect } from "chai";
import { claimBounty } from "../src/operations/bounties/claim";
import {
  deployUtxo,
  newAssign,
  newBounty,
  newClose,
  newMerge,
  signAndSubmit
} from "./utils";
import logger from "../src/logger";

const lucid = await Lucid.new(emulator, "Custom");

describe("Claim tests", async () => {
  const settingsUtxo = await deployUtxo(lucid);
  it("Claim bounty", async () => {
    const createTxId = await newBounty(lucid, settingsUtxo);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const mergeTxId = await newMerge(lucid, assignOutRef, settingsUtxo);
    const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

    const claimTx = await claimBounty(
      settingsUtxo,
      mergeOutRef,
      lucid,
      ACCOUNT_CONTRIBUTOR.address
    );
    emulator.awaitBlock(3);
    lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
    await signAndSubmit(lucid, claimTx);
  });

  it("Claim bounty after close", async () => {
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      const closeTxId = await newClose(lucid, assignOutRef, settingsUtxo);
      const closeOutRef: OutRef = { txHash: closeTxId, outputIndex: 0 };

      const claimTx = await claimBounty(
        settingsUtxo,
        closeOutRef,
        lucid,
        ACCOUNT_CONTRIBUTOR.address
      );
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
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      await claimBounty(
        settingsUtxo,
        assignOutRef,
        lucid,
        ACCOUNT_CONTRIBUTOR.address
      );
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).to.equal("Bounty is not merged");
    }
  });

  it("Claim bounty with no contributor", async () => {
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      await claimBounty(
        settingsUtxo,
        createOutRef,
        lucid,
        ACCOUNT_CONTRIBUTOR.address
      );
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).to.equal("Bounty doesn't have a contributor");
    }
  });

  it("Claim bounty with wrong contributor", async () => {
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      const mergeTxId = await newMerge(lucid, assignOutRef, settingsUtxo);
      const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

      await claimBounty(settingsUtxo, mergeOutRef, lucid, ACCOUNT_0.address);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).to.equal("Invalid contributor");
    }
  });
});
