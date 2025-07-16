import {
  adminAddr,
  githoneyAddr,
  maintainerAddr,
  settingsRef,
} from "../constants";
import { createBounty } from "../operations/bounties/create";
import { lucidBase, signAndSubmit } from "../utils/utils";

const rewardPolicy = "fb279c09175731ade05f7314a9b36cf923c7a3d6873be26bbd1eeccf";
const rewardName = "tokenD";
const rewardAmount = 1_000n;
const bountyId = "bountyTX3";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const { createCbor } = await createBounty(
  githoneyAddr,
  rewardPolicy,
  rewardName,
  rewardAmount,
  bountyId,
  maintainerAddr,
  adminAddr,
  settingsUtxo,
);
console.log("Create transaction CBOR:", createCbor);

await signAndSubmit(createCbor);
