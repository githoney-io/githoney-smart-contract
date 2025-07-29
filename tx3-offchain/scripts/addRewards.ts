import { OutRef } from "@spacebudz/lucid";
import { addRewards } from "../operations/bounties/addRewards.ts";
import { lucidBase, signAndSubmit } from "../utils/utils.ts";
import { settingsRef } from "../constants.ts";

const rewardAmount = 500n;

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const bountyRef: OutRef = {
  txHash: "fb74f030eb2fee1236c3baf7d606e97b36178c8a914cfd1f12066902298a3173",
  outputIndex: 0,
};

const sponsorAddr =
  "addr_test1qqzq2j55hh2ml3h08skfgg04lhh7n7epv2ycn90ntr6ys7zrxalmeg3lyamyahkfwdv6fylkyxj0stj8xpplusva7w7s40czuq";

const { addRewardCbor } = await addRewards(
  rewardAmount,
  settingsUtxo,
  sponsorAddr,
  bountyRef,
);
console.log("Add reward transaction CBOR:", addRewardCbor);

await signAndSubmit(addRewardCbor);
