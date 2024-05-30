import { describe, it } from "mocha";
import { newAssign, newBounty, signAndSubmit } from "./utils";
import { assignContributor } from "../src";
import {
  emulator,
  ACCOUNT_CONTRIBUTOR,
  ACCOUNT_0,
  ACCOUNT_ADMIN
} from "./emulatorConfig";
import { Lucid, OutRef } from "lucid-cardano";
import { mergeBounty } from "../src/operations/merge";

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
    const createTxId = await newBounty(lucid);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const mergeTx = await mergeBounty(assignOutRef, lucid);
    emulator.awaitBlock(1);
    lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
    const mergeTxId = await signAndSubmit(lucid, mergeTx);
    const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

    const assignTx = await assignContributor(
      mergeOutRef,
      ACCOUNT_CONTRIBUTOR.address,
      lucid
    );
    emulator.awaitBlock(1);

    lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
    await signAndSubmit(lucid, assignTx);
  });

  it("Assign Contributor with contributor already assigned", async () => {
    const createTxIdId = await newBounty(lucid);
    const bountyOutRef: OutRef = { txHash: createTxIdId, outputIndex: 0 };
    const assignTx = await assignContributor(
      bountyOutRef,
      ACCOUNT_CONTRIBUTOR.address,
      lucid
    );
    emulator.awaitBlock(1);

    lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
    const txId = await signAndSubmit(lucid, assignTx);

    const assignTx2 = await assignContributor(
      { txHash: txId, outputIndex: 0 },
      ACCOUNT_0.address,
      lucid
    );
    emulator.awaitBlock(1);

    await signAndSubmit(lucid, assignTx2);
  });
});
