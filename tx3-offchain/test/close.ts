import { Assets, OutRef } from "@spacebudz/lucid";
import { adminAddr, settingsRef } from "../constants";
import { closeBounty } from "../operations/bounties/close";
import { lucidBase, signAndSubmit } from "../utils/utils";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const bountyRefBefore: OutRef = {
  txHash: "f9dad7aeaebe37def307e94aaca972228f64fe79916dd85551041e938f4a42ca",
  outputIndex: 0,
};

const bountyRefAfter: OutRef = {
  txHash: "bb50f470becc7f2a90c421e2369260e8fefc6530cf8d1f25c91292970633f02c",
  outputIndex: 0,
};

const rewardUnit =
  "fb279c09175731ade05f7314a9b36cf923c7a3d6873be26bbd1eeccf.746f6b656e44";

const sponsorAddr =
  "addr_test1qqzq2j55hh2ml3h08skfgg04lhh7n7epv2ycn90ntr6ys7zrxalmeg3lyamyahkfwdv6fylkyxj0stj8xpplusva7w7s40czuq";

const refundings: { [key: string]: Assets } = {
  [sponsorAddr]: {
    [rewardUnit]: 50n,
  },
};

console.log("Closing before contributor has been assigned...");
const closeBefore = await closeBounty(
  adminAddr,
  {},
  settingsUtxo,
  bountyRefBefore,
);
console.log("Close bounty transaction CBOR:", closeBefore.closeCbor);
await signAndSubmit(closeBefore.closeCbor);

console.log("Closing after contributor has been assigned...");
const closeAfter = await closeBounty(
  adminAddr,
  {},
  settingsUtxo,
  bountyRefAfter,
);
console.log("Close bounty transaction CBOR:", closeAfter.closeCbor);

await signAndSubmit(closeAfter.closeCbor);
