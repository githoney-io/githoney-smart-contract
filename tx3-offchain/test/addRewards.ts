import { OutRef } from "@spacebudz/lucid";
import { addReward } from "../operations/bounties/addRewards";
import { lucidBase, signAndSubmit } from "../utils/utils";
import { settingsRef } from "../constants";

const rewardAmount = 500n;

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const bountyRef: OutRef = {
  txHash: "b54e5f1ff8e2a5d33ae9370bcd66a4a6235149b1d7caeb2fb7a3eb4838c64fa8",
  outputIndex: 0,
};

const sponsorAddr =
  "addr_test1qqzq2j55hh2ml3h08skfgg04lhh7n7epv2ycn90ntr6ys7zrxalmeg3lyamyahkfwdv6fylkyxj0stj8xpplusva7w7s40czuq";

const { addRewardCbor } = await addReward(
  rewardAmount,
  settingsUtxo,
  sponsorAddr,
  bountyRef,
);
console.log("Add reward transaction CBOR:", addRewardCbor);

await signAndSubmit(addRewardCbor);
