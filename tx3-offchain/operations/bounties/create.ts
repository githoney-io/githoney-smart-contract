import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, Utxo } from "@spacebudz/lucid";
import { creationFee, MIN_ADA, rewardFee } from "../../constants.ts";
import { lucidBase, lucidWithWallet } from "../../utils/utils.ts";
import { collateralOutRef } from "../../utils/utxo.ts";

async function createBounty(
  githoneyAddr: string,
  rewardPolicy: string,
  rewardName: string,
  rewardAmount: bigint,
  bountyId: string,
  maintainerAddr: string,
  adminAddr: string,
  settingsUtxo: Utxo,
): Promise<{
  createCbor: string;
}> {
  const scriptAddress = lucidBase.utils.scriptToAddress(
    settingsUtxo.scriptRef!,
  );
  const scriptHash = Addresses.scriptToCredential(settingsUtxo.scriptRef!).hash;

  const selectedUtxos = await collateralOutRef(lucidWithWallet);

  const collateralref = {
    txid: Buffer.from(selectedUtxos[0].txHash, "hex"),
    index: selectedUtxos[0].outputIndex,
  };

  const now = new Date().getTime() - 60 * 1000; // 1 minute ago
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();

  const deadline = new Date(
    new Date().getTime() + 1000 * 60 * 60 * 24 * 2,
  ).getTime(); // 2 days from now

  const maintainerPaymentCred = Addresses.inspect(maintainerAddr).payment?.hash;
  const maintainerStakeCred =
    Addresses.inspect(maintainerAddr).delegation?.hash || null;
  const adminPaymentCred = Addresses.inspect(adminAddr).payment?.hash;

  const { tx } = await protocol.createTx({
    adminpaymentcredential: {
      value: Buffer.from(adminPaymentCred!, "hex"),
      type: "Bytes",
    },
    bountycreationfee: { value: creationFee, type: "Int" },
    bountyid: { value: Buffer.from(bountyId), type: "Bytes" },
    bountyrewardfee: { value: rewardFee, type: "Int" },
    collateralref: { value: collateralref, type: "UtxoRef" },
    githoneyaddr: { value: githoneyAddr, type: "String" },
    maintainer: { value: maintainerAddr, type: "String" },
    maintainerpaymentcredential: {
      value: Buffer.from(maintainerPaymentCred!, "hex"),
      type: "Bytes",
    },
    maintainerstakecredential: {
      value: Buffer.from(maintainerStakeCred!, "hex"),
      type: "Bytes",
    },
    minada: { value: MIN_ADA, type: "Int" },
    mintingpolicyid: { value: Buffer.from(scriptHash, "hex"), type: "Bytes" },
    rewardamount: { value: rewardAmount, type: "Int" },
    rewardassetname: {
      value: Buffer.from(rewardName),
      type: "Bytes",
    },
    rewardpolicyid: { value: Buffer.from(rewardPolicy, "hex"), type: "Bytes" },
    script: { value: scriptAddress, type: "String" },
    settingsref: {
      value: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
      type: "String",
    },
    since: {
      value: BigInt(lucidBase.utils.unixTimeToSlots(now)),
      type: "Int",
    },
    timelimit: { value: BigInt(deadline), type: "Int" },
    until: {
      value: BigInt(lucidBase.utils.unixTimeToSlots(sixHoursFromNow)),
      type: "Int",
    },
  });

  return {
    createCbor: tx,
  };
}

export { createBounty };
