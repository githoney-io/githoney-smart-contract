import { OutRef } from "@spacebudz/lucid";
import { assignContributor } from "../operations/bounties/assignContributor";
import { lucidBase, signAndSubmit } from "../utils/utils";
import { settingsRef } from "../constants";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const bountyRef: OutRef = {
  txHash: "5836ea948180d3591a892f232926e16552e51c09c8e645953266a10c0a6cb355",
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
