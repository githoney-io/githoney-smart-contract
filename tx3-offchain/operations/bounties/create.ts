import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, fromText, Utxo } from "@spacebudz/lucid";
import { creationFee, MIN_ADA, rewardFee } from "../../constants.ts";
import { lucidBase, lucidWithWallet } from "../../utils/utils.ts";
import { sortUTxOs } from "../../utils/utxo.ts";

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

  const selectedUtxos = await lucidWithWallet.wallet
    .getUtxos()
    .then((utxos) => {
      return utxos.filter(
        (utxo) =>
          utxo.assets["lovelace"] >= 5_000_000 &&
          Object.keys(utxo.assets).length === 1,
      );
    })
    .then((utxos) => sortUTxOs(utxos, "Canonical"));

  const collateralref =
    selectedUtxos[0].txHash + "#" + selectedUtxos[0].outputIndex;

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
    script: scriptAddress,
    githoneyaddr: githoneyAddr,
    maintainerpaymentcredential: Buffer.from(maintainerPaymentCred!, "hex"),
    maintainerstakecredential: Buffer.from(maintainerStakeCred!, "hex"),
    adminpaymentcredential: Buffer.from(adminPaymentCred!, "hex"),
    rewardpolicyid: Buffer.from(rewardPolicy, "hex"),
    rewardassetname: Buffer.from(fromText(rewardName), "hex"),
    rewardamount: Number(rewardAmount),
    since: lucidBase.utils.unixTimeToSlots(now),
    until: lucidBase.utils.unixTimeToSlots(sixHoursFromNow),
    timelimit: deadline,
    bountyid: Buffer.from(bountyId),
    mintingpolicyid: Buffer.from(scriptHash, "hex"),
    collateralref: collateralref,
    minada: Number(MIN_ADA),
    bountyrewardfee: Number(rewardFee),
    bountycreationfee: Number(creationFee),
    maintainer: maintainerAddr,
    settingsref: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
  });

  return {
    createCbor: tx,
  };
}

export { createBounty };
