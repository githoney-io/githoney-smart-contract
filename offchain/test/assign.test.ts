import { describe, it } from "mocha";
import {
  emulator,
  signAndSubmit,
  ACCOUNT_CONTRIBUTOR,
  newBounty,
  ACCOUNT_0,
  newAssign,
  newMerge
} from "./emulatorConfig";
import { Lucid, OutRef } from "lucid-cardano";
import { assignContributor } from "../src/operations/assignContributor";

const lucid = await Lucid.new(emulator, "Custom");

describe("Assign Contributor tests", async () => {
  it("Assign Contributor", async () => {
    const createTx = await newBounty(lucid);
    const bountyOutRef: OutRef = { txHash: createTx.txId, outputIndex: 0 };

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
    const createTx = await newBounty(lucid);
    const createOutRef: OutRef = { txHash: createTx.txId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef);
    const assignOutRef: OutRef = { txHash: assignTxId.txId, outputIndex: 0 };

    const mergeTxId = await newMerge(lucid, assignOutRef);
    const mergeOutRef: OutRef = { txHash: mergeTxId.txId, outputIndex: 0 };

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
    const createTx = await newBounty(lucid);
    const bountyOutRef: OutRef = { txHash: createTx.txId, outputIndex: 0 };
    const assignTx = await assignContributor(
      bountyOutRef,
      ACCOUNT_CONTRIBUTOR.address,
      lucid
    );
    emulator.awaitBlock(1);

    lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
    const tx = await signAndSubmit(lucid, assignTx);

    const assignTx2 = await assignContributor(
      { txHash: tx.txId, outputIndex: 0 },
      ACCOUNT_0.address,
      lucid
    );
    emulator.awaitBlock(1);

    await signAndSubmit(lucid, assignTx2);
  });
});
