import { describe, expect, it } from "@jest/globals";
import { lucidBase as lucid, signAndSubmit } from "../../utils/utils.ts";
import { githoneySeed, settingsRef } from "../../constants.ts";
import { logger, waitForUtxosUpdate } from "../utils.ts";
import { updateSettings } from "../../operations/index.ts";

describe("Update Settings Test", async () => {
  it("Update settings", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);

    const { updateCbor } = await updateSettings(settingsUtxo);
    lucid.selectWalletFromSeed(githoneySeed);
    await signAndSubmit(updateCbor, lucid);
    waitForUtxosUpdate(lucid, updateCbor);
  });

  it("Update with wrong settings", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    try {
      const settings = {
        githoneyWallet: {
          paymentKey: "paymentKey",
          stakeKey: "stakeKey",
        },
        creationFee: 1000000n,
        rewardFee: 1000n,
      };
      const { updateCbor } = await updateSettings(settingsUtxo, settings);
      lucid.selectWalletFromSeed(githoneySeed);
      await signAndSubmit(updateCbor, lucid);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toContain("Creation fee must be at least 2 ADA");
    }
  });
});
