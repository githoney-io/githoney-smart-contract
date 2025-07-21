import { OutRef } from "@spacebudz/lucid";
import { assignContributor } from "../operations/bounties/assignContributor";
import { lucidBase, signAndSubmit } from "../utils/utils";
import { settingsRef } from "../constants";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const bountyRef: OutRef = {
  txHash: "8becd1150fa27534a6d2a4d00758053bedbb83fee2615383248adcfb4b865c1a",
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
