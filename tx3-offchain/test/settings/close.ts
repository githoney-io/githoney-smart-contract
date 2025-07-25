import { closeSettings } from "../../operations/settings/close";
import { settingsRef } from "../../constants";
import { lucidBase, signAndSubmit } from "../../utils/utils";
import { OutRef } from "@spacebudz/lucid";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const utxoRef: OutRef = {
  txHash: "371959f8603f7d529491e8998e8b9e4a5041449a1f05665d4c111a693c705649",
  outputIndex: 1,
};

const { closeCbor } = await closeSettings(settingsUtxo, utxoRef);
console.log("Close settings transaction CBOR:", closeCbor);

await signAndSubmit(closeCbor);
