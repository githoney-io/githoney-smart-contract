import { OutRef } from "@spacebudz/lucid";
import { assignContributor } from "../operations/bounties/assignContributor";
import { lucidBase, signAndSubmit } from "../utils/utils";

const [settingsUtxo] = await lucidBase.utxosByOutRef([
  {
    txHash: "d05c0710320cb81acebd199fea94471a6c0b559617b6ca061dace021fbb59b3d",
    outputIndex: 0,
  },
]);

const bountyRef: OutRef = {
  txHash: "0260d9510cf2557a80113e3159a1863d1e8156e5641333a396843218c4c0c533",
  outputIndex: 0,
};

const contributorAddr =
  "addr_test1qqzq2j55hh2ml3h08skfgg04lhh7n7epv2ycn90ntr6ys7zrxalmeg3lyamyahkfwdv6fylkyxj0stj8xpplusva7w7s40czuq";

const { assignCbor } = await assignContributor(
  contributorAddr,
  settingsUtxo,
  bountyRef,
);
console.log("Assign contributor transaction CBOR:", assignCbor);

await signAndSubmit(assignCbor);
