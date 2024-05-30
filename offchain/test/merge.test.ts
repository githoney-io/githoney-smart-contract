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
    const mergeTx2 = await mergeBounty(mergeOutRef, lucid);
    emulator.awaitBlock(1);

    await signAndSubmit(lucid, mergeTx2);
    emulator.awaitBlock(1);
  });

  it("Merge bounty without contributor", async () => {
    const createTx = await newBounty(lucid);
    const bountyOutRef: OutRef = { txHash: createTx.txId, outputIndex: 0 };

    const mergeTx = await mergeBounty(bountyOutRef, lucid);
    emulator.awaitBlock(1);

    lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
    await signAndSubmit(lucid, mergeTx);
  });
});
