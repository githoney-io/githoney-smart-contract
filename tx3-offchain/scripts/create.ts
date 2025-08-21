import {
  githoneyAddr,
  maintainerAddr,
  maintainerSeed,
  settingsRef,
} from "../constants.ts";
import { createBounty } from "../operations/bounties/create.ts";
import { lucidBase, signAndSubmit } from "../utils/utils.ts";

const rewardPolicy = "fb279c09175731ade05f7314a9b36cf923c7a3d6873be26bbd1eeccf";
const rewardName = "tokenD";
const rewardAmount = 1_000n;
const bountyId = "bountyTX3";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const deadline = new Date(
  new Date().getTime() + 1000 * 60 * 60 * 24 * 2,
).getTime(); // 2 days from now

const { createCbor } = await createBounty(
  rewardPolicy,
  rewardName,
  rewardAmount,
  bountyId,
  maintainerAddr,
  githoneyAddr,
  settingsUtxo,
  BigInt(deadline),
);
lucidBase.selectWalletFromSeed(maintainerSeed);
await signAndSubmit(createCbor);
