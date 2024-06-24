import { describe, it } from "mocha";
import { expect } from "chai";
import { ACCOUNT_GITHONEY, emulator, lucid } from "../emulatorConfig";
import { deployUtxo, signAndSubmit } from "../utils";
import logger from "../../src/logger";
import { update } from "../../src/operations/settings/update";

describe("Update Settings Test", async () => {
  it("Update settings", async () => {
    const settingsUtxo = await deployUtxo(lucid);

    const tx = await update(settingsUtxo, lucid);
    emulator.awaitBlock(3);
    lucid.selectWalletFromSeed(ACCOUNT_GITHONEY.seedPhrase);
    await signAndSubmit(lucid, tx);
  });
});
