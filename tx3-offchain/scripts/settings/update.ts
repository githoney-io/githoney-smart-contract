import { githoneyAddr, settingsRef } from "../../constants.ts";
import { lucidBase, signAndSubmit } from "../../utils/utils.ts";
import { updateSettings } from "../../operations/settings/update.ts";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const newSettings = {
  githoneyAddress: githoneyAddr,
  creationFee: 2100000n,
  rewardFee: 100n,
};

const { updateCbor } = await updateSettings(settingsUtxo, newSettings);
console.log("Deploy settings transaction CBOR:", updateCbor);

await signAndSubmit(updateCbor);
