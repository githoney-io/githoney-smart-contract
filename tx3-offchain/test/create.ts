import { adminAddr, githoneyAddr, maintainerAddr } from "../constants";
import { createBounty } from "../operations/bounties/create";
import { lucidBase, signAndSubmit } from "../utils/utils";

const rewardPolicy = "fb279c09175731ade05f7314a9b36cf923c7a3d6873be26bbd1eeccf";
const rewardName = "tokenD";
const rewardAmount = 1_000n;
const bountyId = "bountyTX3";

const [settingsUtxo] = await lucidBase.utxosByOutRef([
  {
    txHash: "9edc3087527514724b297475f84a8ab316faab1950ce1882715cf4bf88b20b64",
    outputIndex: 0,
  },
]);

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
