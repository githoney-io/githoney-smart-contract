import { closeSettings } from "../../operations/settings/close";
import { settingsRef } from "../../constants";
import { lucidBase, signAndSubmit } from "../../utils/utils";
import { OutRef } from "@spacebudz/lucid";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const utxoRef: OutRef = {
  txHash: "",
  outputIndex: 0,
};

const { closeCbor } = await closeSettings(settingsUtxo, utxoRef);
console.log("Close settings transaction CBOR:", closeCbor);

await signAndSubmit(closeCbor);
