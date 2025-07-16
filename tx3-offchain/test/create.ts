import { adminAddr, githoneyAddr, maintainerAddr } from "../constants";
import { createBounty } from "../operations/bounties/create";
import { lucidBase, signAndSubmit } from "../utils/utils";

const rewardPolicy = "fb279c09175731ade05f7314a9b36cf923c7a3d6873be26bbd1eeccf";
const rewardName = "tokenD";
const rewardAmount = 1_000n;
const bountyId = "bountyTX3";

const [settingsUtxo] = await lucidBase.utxosByOutRef([
  {
    txHash: "cbb68dabcb9f6ee9fb038d9505be33c7a450f1cffa8d7cf4f9757ca39d787ec1",
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
