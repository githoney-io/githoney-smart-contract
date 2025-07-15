import { claimBounty } from "../operations/bounties/claim";
import { lucidBase, signAndSubmit } from "../utils/utils";

const [settingsUtxo] = await lucidBase.utxosByOutRef([
  {
    txHash: "d05c0710320cb81acebd199fea94471a6c0b559617b6ca061dace021fbb59b3d",
    outputIndex: 0,
  },
]);

const [bountyUtxo] = await lucidBase.utxosByOutRef([
  {
    txHash: "0260d9510cf2557a80113e3159a1863d1e8156e5641333a396843218c4c0c533",
    outputIndex: 0,
  },
]);

const { claimCbor } = await claimBounty(settingsUtxo, bountyUtxo);
console.log("Claim bounty transaction CBOR:", claimCbor);

await signAndSubmit(claimCbor);
