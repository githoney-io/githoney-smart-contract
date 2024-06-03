import { describe, it } from "mocha";
import { ACCOUNT_ADMIN, emulator } from "./emulatorConfig";
import { Lucid, OutRef } from "lucid-cardano";
import { mergeBounty } from "../src/operations/merge";
import { closeBounty } from "../src/operations/close";
import { newAssign, newBounty, signAndSubmit } from "./utils";
import { expect } from "chai";

const lucid = await Lucid.new(emulator, "Custom");

describe("Close tests", async () => {
  it("Close Bounty After Contributor Assignment", async () => {
    const createTxId = await newBounty(lucid);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const closeTx = await closeBounty(assignOutRef, lucid);
    emulator.awaitBlock(1);

    lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
    await signAndSubmit(lucid, closeTx);
  });

  it("Close Bounty Before Contributor Assignment", async () => {
    const createTxId = await newBounty(lucid);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const closeTx = await closeBounty(createOutRef, lucid);
    emulator.awaitBlock(1);

    lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
    await signAndSubmit(lucid, closeTx);
  });

  it("Close Bounty already merged", async () => {
    try {
      const createTxId = await newBounty(lucid);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      const mergeTx = await mergeBounty(assignOutRef, lucid);
      emulator.awaitBlock(1);

      lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
      const mergeTxId = await signAndSubmit(lucid, mergeTx);
      const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

      await closeBounty(mergeOutRef, lucid);
    } catch (e) {
      const error = e as Error;
      expect(error.message).to.equal("Bounty already merged");
      console.log("Error:", error.message);
    }
  });
});
