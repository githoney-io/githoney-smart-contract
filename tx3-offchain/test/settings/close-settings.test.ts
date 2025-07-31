import { describe, it } from "@jest/globals";
import { lucidBase as lucid } from "../../utils/utils.ts";
import { closeSettings, deploySettings } from "../../operations/index.ts";
import { githoneyAddr, githoneySeed } from "../../constants.ts";
import { signSubmitAndWaitConfirmation } from "../utils.ts";

describe("Close Settings Test", () => {
  it("Close settings", async () => {
    const { deployCbor, outRef } = await deploySettings(githoneyAddr);
    lucid.selectWalletFromSeed(githoneySeed);
    const deployTxId = await signSubmitAndWaitConfirmation(deployCbor, lucid);

    const deployRef = { txHash: deployTxId, outputIndex: 0 };
    const [settingsUtxo] = await lucid.utxosByOutRef([deployRef]);

    const { closeCbor } = await closeSettings(settingsUtxo, outRef);
    await signSubmitAndWaitConfirmation(closeCbor, lucid);
  }, 300000);
});
