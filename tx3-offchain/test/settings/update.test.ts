import { describe, expect, it } from "@jest/globals";
import { logger, lucidBase as lucid } from "../../utils/utils.ts";
import { githoneySeed, settingsRef } from "../../constants.ts";
import { signSubmitAndWaitConfirmation } from "../utils.ts";
import { updateSettings } from "../../operations/index.ts";

describe("Update Settings Test", () => {
  it("Update settings", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);

    const { updateCbor } = await updateSettings(settingsUtxo);
    lucid.selectWalletFromSeed(githoneySeed);
    await signSubmitAndWaitConfirmation(updateCbor, lucid);
  }, 300000);

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
      await signSubmitAndWaitConfirmation(updateCbor, lucid);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toContain("Creation fee must be at least 2 ADA");
    }
  }, 300000);
});
