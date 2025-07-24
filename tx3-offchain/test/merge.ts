import { OutRef } from "@spacebudz/lucid";
import { adminAddr, settingsRef } from "../constants";
import { lucidBase, signAndSubmit } from "../utils/utils";
import { mergeBounty } from "../operations/bounties/merge";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const bountyRef: OutRef = {
  txHash: "c756b0ce6bc0b2d9cffa340103aceee178047504956ac53db6287debaac321fb",
  outputIndex: 0,
};

const { mergeCbor } = await mergeBounty(adminAddr, settingsUtxo, bountyRef);
console.log("Merge bounty CBOR:", mergeCbor);
await signAndSubmit(mergeCbor);
