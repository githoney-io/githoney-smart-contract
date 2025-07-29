import { describe, it } from "@jest/globals";
import { lucidBase as lucid, signAndSubmit } from "../../utils/utils.ts";
import { closeSettings, deploySettings } from "../../operations/index.ts";
import { githoneyAddr, githoneySeed } from "../../constants.ts";
import { waitForUtxosUpdate } from "../utils.ts";

describe("Close Settings Test", async () => {
  it("Close settings", async () => {
    const { deployCbor, outRef } = await deploySettings(githoneyAddr);
    lucid.selectWalletFromSeed(githoneySeed);
    const deployTxId = await signAndSubmit(deployCbor, lucid);
    waitForUtxosUpdate(lucid, outRef.txHash);

    const settingsRef = { txHash: deployTxId, outputIndex: 0 };
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);

    const { closeCbor } = await closeSettings(settingsUtxo, outRef);
    await signAndSubmit(closeCbor, lucid);
  });
});
