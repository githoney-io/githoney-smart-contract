import { describe, it } from "mocha";
import {
  ACCOUNT_ADMIN,
  emulator,
  signAndSubmit,
  newBounty,
  newAssign
} from "./emulatorConfig";
import { Lucid, OutRef } from "lucid-cardano";
import { mergeBounty } from "../src/operations/merge";
import { expect } from "chai";

const lucid = await Lucid.new(emulator, "Custom");

describe("Merge tests", async () => {
  it("Merge bounty", async () => {
    const createTx = await newBounty(lucid);
    const createOutRef: OutRef = { txHash: createTx.txId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef);
    const assignOutRef: OutRef = { txHash: assignTxId.txId, outputIndex: 0 };

    const mergeTx = await mergeBounty(assignOutRef, lucid);
    emulator.awaitBlock(1);

    lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
    await signAndSubmit(lucid, mergeTx);
  });

  it("Merge bounty already merged", async () => {
    try {
      const createTx = await newBounty(lucid);
      const createOutRef: OutRef = { txHash: createTx.txId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef);
      const assignOutRef: OutRef = { txHash: assignTxId.txId, outputIndex: 0 };

      // First merge
      const mergeTx = await mergeBounty(assignOutRef, lucid);
      emulator.awaitBlock(1);
      lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
      const mergeTxId = await signAndSubmit(lucid, mergeTx);
      emulator.awaitBlock(1);

      // Second merge
      const mergeOutRef: OutRef = { txHash: mergeTxId.txId, outputIndex: 0 };
      await mergeBounty(mergeOutRef, lucid);
    } catch (e) {
      const error = e as Error;
      expect(error.message).to.equal("Bounty already merged");
      console.log("Error:", error.message);
    }
  });

  it("Merge bounty without contributor", async () => {
    try {
      const createTx = await newBounty(lucid);
      const bountyOutRef: OutRef = { txHash: createTx.txId, outputIndex: 0 };

      await mergeBounty(bountyOutRef, lucid);
    } catch (e) {
      const error = e as Error;
      expect(error.message).to.equal("Bounty doesn't have a contributor");
      console.log("Error:", error.message);
    }
  });
});
