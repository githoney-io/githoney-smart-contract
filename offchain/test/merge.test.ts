import { describe, it } from "mocha";
import { ACCOUNT_ADMIN, emulator } from "./emulatorConfig";
import { Lucid, OutRef } from "lucid-cardano";
import { mergeBounty } from "../src/operations/merge";
import { newAssign, newBounty, signAndSubmit } from "./utils";
import { expect } from "chai";

const lucid = await Lucid.new(emulator, "Custom");

describe("Merge tests", async () => {
  it("Merge bounty", async () => {
    const createTxIdId = await newBounty(lucid);
    const createOutRef: OutRef = { txHash: createTxIdId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const mergeTx = await mergeBounty(assignOutRef, lucid);
    emulator.awaitBlock(3);

    lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
    await signAndSubmit(lucid, mergeTx);
  });

  it("Merge bounty already merged", async () => {
    try {
      const createTxId = await newBounty(lucid);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      // First merge
      const mergeTx = await mergeBounty(assignOutRef, lucid);
      emulator.awaitBlock(3);
      lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
      const mergeTxId = await signAndSubmit(lucid, mergeTx);
      emulator.awaitBlock(3);

      // Second merge
      const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };
      await mergeBounty(mergeOutRef, lucid);
    } catch (e) {
      const error = e as Error;
      console.log("Error:", error.message);
      expect(error.message).to.equal("Bounty already merged");
    }
  });

  it("Merge bounty without contributor", async () => {
    try {
      const createTxId = await newBounty(lucid);
      const bountyOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      await mergeBounty(bountyOutRef, lucid);
    } catch (e) {
      const error = e as Error;
      console.log("Error:", error.message);
      expect(error.message).to.equal("Bounty doesn't have a contributor");
    }
  });
});
