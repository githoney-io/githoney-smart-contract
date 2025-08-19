import { OutRef } from "@spacebudz/lucid";
import { githoneyAddr, githoneySeed, settingsRef } from "../constants.ts";
import { lucidBase, signAndSubmit } from "../utils/utils.ts";
import { mergeBounty } from "../operations/bounties/merge.ts";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const bountyRef: OutRef = {
  txHash: "24c54eba5d4af56ec72897cea328b0a4542d577416178c73d9501b29a31d3944",
  outputIndex: 0,
};

lucidBase.selectWalletFromSeed(githoneySeed);
const { mergeCbor } = await mergeBounty(
  githoneyAddr,
  settingsUtxo,
  bountyRef,
  lucidBase,
);
await signAndSubmit(mergeCbor);
