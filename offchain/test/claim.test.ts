import { describe, it } from "mocha";
import {
  emulator,
  signAndSubmit,
  newBounty,
  newAssign,
  newMerge,
  ACCOUNT_CONTRIBUTOR,
  newClose,
  ACCOUNT_0
} from "./emulatorConfig";
import { Lucid, OutRef } from "lucid-cardano";
import { expect } from "chai";
import { claimBounty } from "../src/operations/claim";

const lucid = await Lucid.new(emulator, "Custom");

describe("Claim tests", async () => {
  it("Claim bounty", async () => {
    const createTx = await newBounty(lucid);
    const createOutRef: OutRef = { txHash: createTx.txId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef);
    const assignOutRef: OutRef = { txHash: assignTxId.txId, outputIndex: 0 };

    const mergeTx = await newMerge(lucid, assignOutRef);
    const mergeOutRef: OutRef = { txHash: mergeTx.txId, outputIndex: 0 };

    const claimTx = await claimBounty(
      mergeOutRef,
      lucid,
      ACCOUNT_CONTRIBUTOR.address
    );
    emulator.awaitBlock(1);
    lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
    await signAndSubmit(lucid, claimTx);
  });

  it("Claim bounty after close", async () => {
    try {
      const createTx = await newBounty(lucid);
      const createOutRef: OutRef = { txHash: createTx.txId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef);
      const assignOutRef: OutRef = { txHash: assignTxId.txId, outputIndex: 0 };

      const closeTx = await newClose(lucid, assignOutRef);
      const closeOutRef: OutRef = { txHash: closeTx.txId, outputIndex: 0 };

      const claimTx = await claimBounty(
        closeOutRef,
        lucid,
        ACCOUNT_CONTRIBUTOR.address
      );
      emulator.awaitBlock(1);
      lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
      await signAndSubmit(lucid, claimTx);
    } catch (e) {
      const error = e as Error;
      expect(error.message).to.equal("This UTxO does not have a datum hash.");
      console.log("Error:", error.message);
    }
  });

  it("Claim bounty not merged", async () => {
    try {
      const createTx = await newBounty(lucid);
      const createOutRef: OutRef = { txHash: createTx.txId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef);
      const assignOutRef: OutRef = { txHash: assignTxId.txId, outputIndex: 0 };

      await claimBounty(assignOutRef, lucid, ACCOUNT_CONTRIBUTOR.address);
    } catch (e) {
      const error = e as Error;
      expect(error.message).to.equal("Bounty is not merged");
      console.log("Error:", error.message);
    }
  });

  it("Claim bounty with no contributor", async () => {
    try {
      const createTx = await newBounty(lucid);
      const createOutRef: OutRef = { txHash: createTx.txId, outputIndex: 0 };

      await claimBounty(createOutRef, lucid, ACCOUNT_CONTRIBUTOR.address);
    } catch (e) {
      const error = e as Error;
      expect(error.message).to.equal("Bounty doesn't have a contributor");
      console.log("Error:", error.message);
    }
  });

  it("Claim bounty with wrong contributor", async () => {
    try {
      const createTx = await newBounty(lucid);
      const createOutRef: OutRef = { txHash: createTx.txId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef);
      const assignOutRef: OutRef = { txHash: assignTxId.txId, outputIndex: 0 };

      const mergeTx = await newMerge(lucid, assignOutRef);
      const mergeOutRef: OutRef = { txHash: mergeTx.txId, outputIndex: 0 };

      await claimBounty(mergeOutRef, lucid, ACCOUNT_0.address);
    } catch (e) {
      const error = e as Error;
      expect(error.message).to.equal("Invalid contributor");
      console.log("Error:", error.message);
    }
  });
});
