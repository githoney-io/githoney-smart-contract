import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, Utxo } from "@spacebudz/lucid";
import { creationFee, rewardFee } from "../../constants.ts";
import { lucidBase, lucidWithWallet } from "../../utils/utils.ts";
import { sortUTxOs } from "../../utils/utxo.ts";
import { Address } from "@blaze-cardano/core";

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
  console.log("scriptHash:", scriptHash);

  const selectedUtxos = await lucidWithWallet.wallet
    .getUtxos()
    .then((utxos) => {
      console.log("Selected UTXOs:", utxos);
      return utxos.filter(
        (utxo) =>
          utxo.assets["lovelace"] >= 5_000_000 &&
          Object.keys(utxo.assets).length === 1,
      );
    })
    .then((utxos) => sortUTxOs(utxos, "Canonical"));

  const collateralref =
    selectedUtxos[0].txHash + "#" + selectedUtxos[0].outputIndex;

  const now = new Date().getTime() - 60;
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();

  // TODO - using lucid instead
  const maintainerAddress = Address.fromBech32(maintainerAddr).asBase();
  const maintainerPaymentCred = maintainerAddress?.getPaymentCredential()!;
  const maintainerStakeCred = maintainerAddress?.getStakeCredential()!;

  const { tx } = await protocol.createTx({
    script: scriptAddress,
    githoneyaddr: githoneyAddr,
    maintainerpaymentcredential: Buffer.from(maintainerPaymentCred.hash, "hex"),
    maintainerstakecredential: Buffer.from(maintainerStakeCred.hash, "hex"),
    adminaddr: Buffer.from(adminAddr),
    rewardpolicyid: Buffer.from(rewardPolicy, "hex"),
    rewardassetname: Buffer.from(rewardName),
    rewardamount: Number(rewardAmount),
    since: lucidBase.utils.unixTimeToSlots(now),
    until: lucidBase.utils.unixTimeToSlots(sixHoursFromNow),
    bountyid: Buffer.from(bountyId),
    mintingpolicyid: Buffer.from(scriptHash, "hex"),
    collateralref: collateralref,
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
