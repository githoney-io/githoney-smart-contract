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
    adminpaymentcredential: Buffer.from(adminPaymentCred!, "hex"),
    bountycreationfee: Number(creationFee),
    bountyid: Buffer.from(bountyId),
    bountyrewardfee: Number(rewardFee),
    collateralref: collateralref,
    githoneyaddr: githoneyAddr,
    maintainer: maintainerAddr,
    maintainerpaymentcredential: Buffer.from(maintainerPaymentCred!, "hex"),
    maintainerstakecredential: Buffer.from(maintainerStakeCred!, "hex"),
    minada: Number(MIN_ADA),
    mintingpolicyid: Buffer.from(scriptHash, "hex"),
    rewardamount: Number(rewardAmount),
    rewardassetname: Buffer.from(fromText(rewardName), "hex"),
    rewardpolicyid: Buffer.from(rewardPolicy, "hex"),
    script: scriptAddress,
    settingsref: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
    since: lucidBase.utils.unixTimeToSlots(now),
    timelimit: deadline,
    until: lucidBase.utils.unixTimeToSlots(sixHoursFromNow),
  });

  return {
    createCbor: tx,
  };
}

export { createBounty };
