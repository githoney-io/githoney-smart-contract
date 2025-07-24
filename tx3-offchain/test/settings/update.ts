import { githoneyAddr, settingsRef } from "../../constants";
import { lucidBase, signAndSubmit } from "../../utils/utils";
import { updateSettings } from "../../operations/settings/update";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const newSettings = {
  githoneyAddress: githoneyAddr,
  creationFee: 2100000n,
  rewardFee: 100n,
};

const { updateCbor } = await updateSettings(settingsUtxo, newSettings);
console.log("Deploy settings transaction CBOR:", updateCbor);

await signAndSubmit(updateCbor);
