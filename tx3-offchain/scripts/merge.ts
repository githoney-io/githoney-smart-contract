import { OutRef } from "@spacebudz/lucid";
import { adminAddr, settingsRef } from "../constants";
import { lucidBase, signAndSubmit } from "../utils/utils";
import { mergeBounty } from "../operations/bounties/merge";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const bountyRef: OutRef = {
  txHash: "24c54eba5d4af56ec72897cea328b0a4542d577416178c73d9501b29a31d3944",
  outputIndex: 0,
};

const { mergeCbor } = await mergeBounty(adminAddr, settingsUtxo, bountyRef);
console.log("Merge bounty CBOR:", mergeCbor);
await signAndSubmit(mergeCbor);
