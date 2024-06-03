import { describe, it } from "mocha";
import { newAssign, newBounty, newMerge, signAndSubmit } from "./utils";
import { assignContributor } from "../src";
import {
  emulator,
  ACCOUNT_CONTRIBUTOR,
  ACCOUNT_0,
  ACCOUNT_ADMIN
} from "./emulatorConfig";
import { Lucid, OutRef } from "lucid-cardano";
import { mergeBounty } from "../src/operations/merge";
import { expect } from "chai";

const lucid = await Lucid.new(emulator, "Custom");

describe("Assign Contributor tests", async () => {
  it("Assign Contributor", async () => {
    const createTxIdId = await newBounty(lucid);
    const bountyOutRef: OutRef = { txHash: createTxIdId, outputIndex: 0 };

    const assignTx = await assignContributor(
      bountyOutRef,
      ACCOUNT_CONTRIBUTOR.address,
      lucid
    );
    emulator.awaitBlock(1);

    lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
    await signAndSubmit(lucid, assignTx);
  });

  it("Assign Contributor with already merged bounty", async () => {
    try {
      const createTxId = await newBounty(lucid);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      const mergeTxId = await newMerge(lucid, assignOutRef);
      const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

      await assignContributor(mergeOutRef, ACCOUNT_CONTRIBUTOR.address, lucid);
    } catch (e) {
      const error = e as Error;
      expect(error.message).to.equal("Bounty already merged");
      console.log("Error:", error.message);
    }
  });

  it("Assign Contributor with contributor already assigned", async () => {
    try {
      const createTxId = await newBounty(lucid);
      const bountyOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };
      const assignTx = await assignContributor(
        bountyOutRef,
        ACCOUNT_CONTRIBUTOR.address,
        lucid
      );
      emulator.awaitBlock(1);

      lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
      const txId = await signAndSubmit(lucid, assignTx);

      await assignContributor(
        { txHash: txId, outputIndex: 0 },
        ACCOUNT_0.address,
        lucid
      );
    } catch (e) {
      const error = e as Error;
      expect(error.message).to.equal("Bounty already has a contributor");
      console.log("Error:", error.message);
    }
  });
});
