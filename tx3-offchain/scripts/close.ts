import { Assets, OutRef } from "@spacebudz/lucid";
import { adminAddr, adminSeed, settingsRef } from "../constants.ts";
import { closeBounty } from "../operations/bounties/close.ts";
import { lucidBase, signAndSubmit } from "../utils/utils.ts";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

// CLOSE BEFORE ADD REWARDS

const bountyRefBefore: OutRef = {
  txHash: "f9dad7aeaebe37def307e94aaca972228f64fe79916dd85551041e938f4a42ca",
  outputIndex: 0,
};

console.log("Closing before contributor has been assigned...");
const closeBefore = await closeBounty(
  adminAddr,
  {},
  settingsUtxo,
  bountyRefBefore,
);
lucidBase.selectWalletFromSeed(adminSeed);
await signAndSubmit(closeBefore.closeCbor);

const bountyRefAfter: OutRef = {
  txHash: "9986183b14b57dea35a6f7cec0b052a9966b32dfe22935da3ad2966288642639",
  outputIndex: 0,
};

console.log("Closing after contributor has been assigned...");
const closeAfter = await closeBounty(
  adminAddr,
  {},
  settingsUtxo,
  bountyRefAfter,
);
await signAndSubmit(closeAfter.closeCbor);

// CLOSE AFTER ADD REWARDS

const rewardUnit =
  "fb279c09175731ade05f7314a9b36cf923c7a3d6873be26bbd1eeccf746f6b656e44";

const sponsorAddr =
  "addr_test1qqzq2j55hh2ml3h08skfgg04lhh7n7epv2ycn90ntr6ys7zrxalmeg3lyamyahkfwdv6fylkyxj0stj8xpplusva7w7s40czuq";

const refundings: { [key: string]: Assets } = {
  [sponsorAddr]: {
    [rewardUnit]: 500n,
  },
};

const bountyRefBeforeWithRewards: OutRef = {
  txHash: "e2f17d07ebf4f8395081ad9d9fa5da5c8dfef486046e7ada5a2eba0279b69bd7",
  outputIndex: 0,
};

const closeBeforeWithRewards = await closeBounty(
  adminAddr,
  refundings,
  settingsUtxo,
  bountyRefBeforeWithRewards,
);
await signAndSubmit(closeBeforeWithRewards.closeCbor);

const bountyRefAfterWithRewards: OutRef = {
  txHash: "cf6376d428531462f804cc7cb5cf1bb9995564b335acc5cbe5111d775a05fe0f",
  outputIndex: 0,
};

const closeAfterWithRewards = await closeBounty(
  adminAddr,
  refundings,
  settingsUtxo,
  bountyRefAfterWithRewards,
);
await signAndSubmit(closeAfterWithRewards.closeCbor);
