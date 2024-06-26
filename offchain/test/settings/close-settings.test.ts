import { describe, it } from "mocha";
import { ACCOUNT_GITHONEY, emulator, lucid } from "../emulatorConfig";
import { deployUtxo, signAndSubmit } from "../utils";
import { closeSettings } from "../../src/operations/settings/close";

describe("Close Settings Test", async () => {
  it("Close settings", async () => {
    const { settingsUtxo, outRef } = await deployUtxo(lucid);
    const tx = await closeSettings(outRef, settingsUtxo, lucid);
    emulator.awaitBlock(3);
    lucid.selectWalletFromSeed(ACCOUNT_GITHONEY.seedPhrase);
    await signAndSubmit(lucid, tx);
  });
});
