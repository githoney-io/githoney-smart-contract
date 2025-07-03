import { protocol } from "../gen/typescript/protocol.ts";
import { paymentCredentialOf, Utxo } from "@spacebudz/lucid";
import { creationFee, rewardFee } from "../constants.ts";
import { GithoneyContractSettingsSpend } from "../plutus.ts";
import {
  lucidBase,
  lucidWithWallet,
  toPreviewBlockSlot,
} from "../utils/utils.ts";
import { selectUTxOs, sortUTxOs } from "../utils/utxo.ts";
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
  const script = new GithoneyContractSettingsSpend();
  const scriptAddress = lucidBase.utils.scriptToAddress(script);
  const scriptHash = paymentCredentialOf(scriptAddress).hash;

  const selectedUtxos = await lucidWithWallet.wallet
    .getUtxos()
    .then((utxos) => selectUTxOs(utxos, { lovelace: 10_000_000n }))
    .then((utxos) => sortUTxOs(utxos, "Canonical"));

  const collateralref =
    selectedUtxos[0].txHash + "#" + selectedUtxos[0].outputIndex;

  const now = new Date().getTime();
  const sixHoursFromNow = new Date(now + 30 * 60 * 60 * 1000).getTime();

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
    since: toPreviewBlockSlot(now),
    until: toPreviewBlockSlot(sixHoursFromNow),
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
