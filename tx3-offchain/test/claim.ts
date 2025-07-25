import { OutRef } from "@spacebudz/lucid";
import { settingsRef } from "../constants";
import { claimBounty } from "../operations/bounties/claim";
import { lucidBase, signAndSubmit } from "../utils/utils";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const bountyRef: OutRef = {
  txHash: "284e48cd4328c1e62304a93b6d321422003a46e65ac293411b51070ff284a7af",
  outputIndex: 0,
};

const { claimCbor } = await claimBounty(settingsUtxo, bountyRef);
console.log("Claim bounty transaction CBOR:", claimCbor);

await signAndSubmit(claimCbor);
