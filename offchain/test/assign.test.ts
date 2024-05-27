import { describe, it } from "mocha";
import {
  ACCOUNT_ADMIN,
  ACCOUNT_MANTAINER,
  bounty_id,
  emulator,
  signAndSubmit,
  ACCOUNT_CONTRIBUTOR
} from "./emulatorConfig";
import { Lucid, OutRef } from "lucid-cardano";
import { assignContributor } from "../src/operations/assignContributor";
import { createBounty } from "../src/operations/create";

const lucid = await Lucid.new(emulator, "Custom");

describe("Assign Contributor tests", async () => {
  const now = new Date();
  const deadline = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1).getTime(); // Tomorrow
  console.log("Deadline", deadline);
  const createTx = await createBounty(
    ACCOUNT_MANTAINER.address,
    ACCOUNT_ADMIN.address,
    {
      unit: "lovelace",
      amount: 100n
    },
    BigInt(deadline),
    bounty_id,
    lucid
  );
  emulator.awaitBlock(1);

  lucid.selectWalletFromSeed(ACCOUNT_MANTAINER.seedPhrase);
  const { txId } = await signAndSubmit(lucid, createTx);
  emulator.awaitBlock(3);

  it("Assign Contributor", async () => {
    const bountyOutRef: OutRef = { txHash: txId, outputIndex: 0 };

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
  });

  //   it("Assign Contributor with contributor already assigned", async () => {
  //     const [bountyUTxO] = await lucid.utxosByOutRef([
  //       { txHash: txId, outputIndex: 0 }
  //     ]);
  //     const assignTx = await assignContributor(
  //       bountyUTxO,
  //       ACCOUNT_CONTRIBUTOR.address,
  //       lucid
  //     );
  //     emulator.awaitBlock(1);

  //     lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
  //     signAndSubmit(lucid, assignTx);

  //     const assignTx2 = await assignContributor(
  //       bountyUTxO,
  //       ACCOUNT_CONTRIBUTOR.address,
  //       lucid
  //     );
  //     emulator.awaitBlock(1);

  //     await signAndSubmit(lucid, assignTx2);
  //   });
});
