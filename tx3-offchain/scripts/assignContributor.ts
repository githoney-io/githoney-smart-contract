import { OutRef } from "@spacebudz/lucid";
import { assignContributor } from "../operations/bounties/assignContributor.ts";
import { lucidBase, signAndSubmit } from "../utils/utils.ts";
import { contributorSeed, settingsRef } from "../constants.ts";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const bountyRef: OutRef = {
  txHash: "4e7cdd89162c644558f8d83e2907050043f01b1a73f999745e530bd2e8008ecb",
  outputIndex: 0,
};

const contributorAddr =
  "addr_test1qqzq2j55hh2ml3h08skfgg04lhh7n7epv2ycn90ntr6ys7zrxalmeg3lyamyahkfwdv6fylkyxj0stj8xpplusva7w7s40czuq";

const { assignCbor } = await assignContributor(
  contributorAddr,
  settingsUtxo,
  bountyRef,
);
lucidBase.selectWalletFromSeed(contributorSeed);
await signAndSubmit(assignCbor, lucidBase);
