import { OutRef } from "@spacebudz/lucid";
import { assignContributor } from "../operations/bounties/assignContributor";
import { lucidBase, signAndSubmit } from "../utils/utils";
import { settingsRef } from "../constants";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const bountyRef: OutRef = {
  txHash: "f31d63382bdfb0d4d19849e51b43d1390c412e1c34afec1aa65de68188d322ce",
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
