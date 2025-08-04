import { githoneyAddr, githoneySeed, settingsRef } from "../../constants.ts";
import { lucidBase, signAndSubmit } from "../../utils/utils.ts";
import { updateSettings } from "../../operations/settings/update.ts";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const newSettings = {
  githoneyAddress: githoneyAddr,
  creationFee: 2100000n,
  rewardFee: 100n,
};

const { updateCbor } = await updateSettings(settingsUtxo, newSettings);
lucidBase.selectWalletFromSeed(githoneySeed);
await signAndSubmit(updateCbor);
