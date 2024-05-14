import { describe, it } from "mocha";
import {
  ACCOUNT_MANTAINER,
  createNewBounty,
  emulator
} from "../emulatorConfig";
import { Lucid } from "lucid-cardano";

const lucid = await Lucid.new(emulator, "Custom");

describe("Create tests", () => {
  it("Create a New Bounty", async () => {
    const { tx } = await createNewBounty(lucid, emulator);
    emulator.awaitBlock(1);
    // Sign and submit the transaction
    lucid.selectWalletFromSeed(ACCOUNT_MANTAINER.seedPhrase);
    const createTx = await lucid
      .fromTx(tx)
      .sign()
      .complete()
      .then((signedTx) => signedTx.submit());
    console.log("SUCCESS CREATE BOUNTY", createTx);
  });
});
