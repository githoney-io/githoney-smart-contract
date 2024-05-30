import { describe, it } from "mocha";
import { ACCOUNT_ADMIN, emulator } from "./emulatorConfig";
import { Lucid, OutRef } from "lucid-cardano";
import { mergeBounty } from "../src/operations/merge";
import { newAssign, newBounty, signAndSubmit } from "./utils";

const lucid = await Lucid.new(emulator, "Custom");

describe("Merge tests", async () => {
  it("Merge bounty", async () => {
    const createTxIdId = await newBounty(lucid);
    const createOutRef: OutRef = { txHash: createTxIdId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const mergeTx = await mergeBounty(assignOutRef, lucid);
    emulator.awaitBlock(1);

    lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
    await signAndSubmit(lucid, mergeTx);
  });

  it("Merge bounty already merged", async () => {
    const createTxId = await newBounty(lucid);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };
    emulator.awaitBlock(1);
    // First merge
    const mergeTx = await mergeBounty(assignOutRef, lucid);
    emulator.awaitBlock(1);
    lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
    const mergeTxId = await signAndSubmit(lucid, mergeTx);
    emulator.awaitBlock(1);

    // Second merge
    const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };
    const mergeTx2 = await mergeBounty(mergeOutRef, lucid);
    emulator.awaitBlock(1);

    await signAndSubmit(lucid, mergeTx2);
    emulator.awaitBlock(1);
  });

  it("Merge bounty without contributor", async () => {
    const createTxId = await newBounty(lucid);
    const bountyOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const mergeTx = await mergeBounty(bountyOutRef, lucid);
    emulator.awaitBlock(1);

    lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
    await signAndSubmit(lucid, mergeTx);
  });
});
