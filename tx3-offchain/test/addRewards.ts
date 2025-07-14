import { addReward } from "../operations/bounties/addRewards";
import { lucidBase, signAndSubmit } from "../utils/utils";

const rewardAmount = 1_000n;

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

const userAddr =
  "addr_test1qqzq2j55hh2ml3h08skfgg04lhh7n7epv2ycn90ntr6ys7zrxalmeg3lyamyahkfwdv6fylkyxj0stj8xpplusva7w7s40czuq";

const { addRewardCbor } = await addReward(
  userAddr,
  rewardAmount,
  settingsUtxo,
  bountyUtxo,
);
console.log("Add reward transaction CBOR:", addRewardCbor);

await signAndSubmit(addRewardCbor);
