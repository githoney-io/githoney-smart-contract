import { closeSettings } from "../../operations/settings/close.ts";
import { settingsRef } from "../../constants.ts";
import { lucidBase, signAndSubmit } from "../../utils/utils.ts";
import { OutRef } from "@spacebudz/lucid";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const utxoRef: OutRef = {
  txHash: "40881ea16f1b35a8c50cf7d83c40d73e1d7439df1af5ae9841cb20e433f131fd",
  outputIndex: 3,
};

const { closeCbor } = await closeSettings(settingsUtxo, utxoRef);
console.log("Close settings transaction CBOR:", closeCbor);

await signAndSubmit(closeCbor);
