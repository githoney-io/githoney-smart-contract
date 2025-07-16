import { Assets, OutRef } from "@spacebudz/lucid";
import { adminAddr, settingsRef } from "../constants";
import { closeBounty } from "../operations/bounties/close";
import { lucidBase, signAndSubmit } from "../utils/utils";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const bountyRef: OutRef = {
  txHash: "bb50f470becc7f2a90c421e2369260e8fefc6530cf8d1f25c91292970633f02c",
  outputIndex: 0,
};

const refundings: { [key: string]: Assets } = {};

const { closeCbor } = await closeBounty(
  adminAddr,
  refundings,
  settingsUtxo,
  bountyRef,
);
console.log("Close bounty transaction CBOR:", closeCbor);

await signAndSubmit(closeCbor);
