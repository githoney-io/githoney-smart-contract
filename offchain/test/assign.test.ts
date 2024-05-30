import { describe, it } from "mocha";
import { emulator, ACCOUNT_CONTRIBUTOR, ACCOUNT_0 } from "./emulatorConfig";
import { Lucid, OutRef } from "lucid-cardano";
import { newBounty, signAndSubmit } from "./utils";
import { assignContributor } from "../src";

const lucid = await Lucid.new(emulator, "Custom");

describe("Assign Contributor tests", async () => {
  it("Assign Contributor", async () => {
    const createTxId = await newBounty(lucid);
    const bountyOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTx = await assignContributor(
      bountyOutRef,
      ACCOUNT_CONTRIBUTOR.address,
      lucid
    );
    emulator.awaitBlock(1);

    lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
    await signAndSubmit(lucid, assignTx);
  });

  // it("Assign Contributor with already merged bounty", async () => {
  // TODO - Add merged bounty
  // const [bountyUTxO] = await lucid.utxosByOutRef([
  //   { txHash: txId, outputIndex: 0 }
  // ]);
  // const assignTx = await assignContributor(
  //   bountyUTxO,
  //   ACCOUNT_CONTRIBUTOR.address,
  //   lucid
  // );
  // emulator.awaitBlock(1);
  // lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
  // await signAndSubmit(lucid, assignTx);
  // });

  it("Assign Contributor with contributor already assigned", async () => {
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

    emulator.awaitBlock(1);

    const assignTx2 = await assignContributor(
      { txHash: txId, outputIndex: 0 },
      ACCOUNT_0.address,
      lucid
    );
    emulator.awaitBlock(1);

    await signAndSubmit(lucid, assignTx2);
  });
});
