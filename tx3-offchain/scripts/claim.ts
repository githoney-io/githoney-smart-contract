import { OutRef } from "@spacebudz/lucid";
import { settingsRef } from "../constants.ts";
import { claimBounty } from "../operations/bounties/claim.ts";
import { lucidBase, signAndSubmit } from "../utils/utils.ts";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const bountyRef: OutRef = {
  txHash: "40881ea16f1b35a8c50cf7d83c40d73e1d7439df1af5ae9841cb20e433f131fd",
  outputIndex: 0,
};

const { claimCbor } = await claimBounty(settingsUtxo, bountyRef);
console.log("Claim bounty transaction CBOR:", claimCbor);

await signAndSubmit(claimCbor);
