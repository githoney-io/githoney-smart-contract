import { OutRef } from "@spacebudz/lucid";
import { adminAddr, maintainerAddr, settingsRef } from "../constants";
import { closeBounty } from "../operations/bounties/close";
import { lucidBase, signAndSubmit } from "../utils/utils";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const bountyRef: OutRef = {
  txHash: "bb50f470becc7f2a90c421e2369260e8fefc6530cf8d1f25c91292970633f02c",
  outputIndex: 0,
};

const contributorAddr =
  "addr_test1qqzq2j55hh2ml3h08skfgg04lhh7n7epv2ycn90ntr6ys7zrxalmeg3lyamyahkfwdv6fylkyxj0stj8xpplusva7w7s40czuq";

const { closeCbor } = await closeBounty(
  adminAddr,
  contributorAddr,
  maintainerAddr,
  settingsUtxo,
  bountyRef,
);
console.log("Close bounty transaction CBOR:", closeCbor);

await signAndSubmit(closeCbor);
