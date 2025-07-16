import { OutRef } from "@spacebudz/lucid";
import { addReward } from "../operations/bounties/addRewards";
import { lucidBase, signAndSubmit } from "../utils/utils";
import { settingsRef } from "../constants";

const rewardAmount = 500n;

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const bountyRef: OutRef = {
  txHash: "d87fc25a938aeef9ce0f6773bad4fccc34f42a93aed24b72fdb78e20568bf174",
  outputIndex: 0,
};

const userAddr =
  "addr_test1qqzq2j55hh2ml3h08skfgg04lhh7n7epv2ycn90ntr6ys7zrxalmeg3lyamyahkfwdv6fylkyxj0stj8xpplusva7w7s40czuq";

const { addRewardCbor } = await addReward(
  rewardAmount,
  settingsUtxo,
  userAddr,
  bountyRef,
);
console.log("Add reward transaction CBOR:", addRewardCbor);

await signAndSubmit(addRewardCbor);
