import { describe, it } from "mocha";
import {
  ACCOUNT_ADMIN,
  ACCOUNT_MANTAINER,
  bounty_id,
  emulator
} from "../emulatorConfig";
import { Lucid } from "lucid-cardano";
import { createBounty } from "../../src/operations/create";

const lucid = await Lucid.new(emulator, "Custom");

const signAndSubmitCreate = async (lucid: Lucid, tx: any) => {
  const createTx = await lucid
    .fromTx(tx)
    .sign()
    .complete()
    .then((signedTx) => signedTx.submit());
  console.log("SUCCESS CREATE BOUNTY", createTx);
};

describe("Create tests", () => {
  const now = new Date();
  it("Create a New Bounty", async () => {
    const deadline = new Date(
      now.getTime() + 1000 * 60 * 60 * 24 * 1
    ).getTime(); // Tomorrow
    const tx = await createBounty(
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
    // Sign and submit the transaction
    lucid.selectWalletFromSeed(ACCOUNT_MANTAINER.seedPhrase);
    signAndSubmitCreate(lucid, tx);
  });
});
