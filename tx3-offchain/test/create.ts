import { adminAddr, githoneyAddr, maintainerAddr } from "../constants";
import { createBounty } from "../operations/create";
import { lucidBase, lucidWithWallet } from "../utils/utils";

const rewardPolicy = "fb279c09175731ade05f7314a9b36cf923c7a3d6873be26bbd1eeccf";
const rewardName = "tokenD";
const rewardAmount = 1_000n;
const bountyId = "bountyTX3";

const [settingsUtxo] = await lucidBase.utxosByOutRef([
  {
    txHash: "d05c0710320cb81acebd199fea94471a6c0b559617b6ca061dace021fbb59b3d",
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

const sign = await lucidWithWallet.fromTx(createCbor);
const signedTx = await sign.sign().commit();
const submit = await signedTx.submit();
console.log("Transaction submitted:", submit);
