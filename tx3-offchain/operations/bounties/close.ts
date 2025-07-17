import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, Assets, fromUnit, OutRef, Utxo } from "@spacebudz/lucid";
import {
  extractBountyIdTokenUnit,
  getRewardAsset,
  keyPairsToAddress,
  lucidBase,
  lucidWithWallet,
} from "../../utils/utils.ts";
import { sortUTxOs } from "../../utils/utxo.ts";
import { MIN_ADA } from "../../constants.ts";
import { GithoneyContractGithoneySpend } from "../../plutus.ts";

async function closeBounty(
  adminAddr: string,
  refundings: { [key: string]: Assets },
  settingsUtxo: Utxo,
  utxoRef: OutRef,
): Promise<{
  closeCbor: string;
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

  const [bountyUtxo] = await lucidBase.utxosByOutRef([utxoRef]);

  const bountyDatum = await lucidBase.datumOf(
    bountyUtxo,
    GithoneyContractGithoneySpend.datum,
  );

  if (bountyDatum.merged) {
    throw new Error("Bounty already merged");
  }
  // TODO - check if refundings are valid and implement the logic of payment

  // const sponsorAddr = Object.keys(refundings)[0];

  // const refundingAssets = Object.values(refundings)[0];
  // console.log("refundings assets", refundingAssets);

  // const [refundingPolicy, refundingName] =
  //   Object.keys(refundingAssets)[0].split(".");
  // const refundingAmount = Object.values(refundingAssets)[0];

  const now = new Date().getTime() - 60;
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();

  const bountyIdTokenUnit = extractBountyIdTokenUnit(
    bountyUtxo.assets,
    scriptHash,
  );

  const { rewardPolicy, rewardName, rewardAmount } = getRewardAsset(
    bountyUtxo.assets,
    scriptHash,
  );

  const maintainerAddr = keyPairsToAddress(
    lucidBase.network,
    bountyDatum.maintainerAddress,
  );

  let tx;

  if (bountyDatum.contributorAddress) {
    const contributorAddr = keyPairsToAddress(
      lucidBase.network,
      bountyDatum.contributorAddress,
    );
    tx = await protocol.closeAfterContributorTx({
      script: scriptAddress,
      contributor: contributorAddr,
      admin: adminAddr,
      maintainer: maintainerAddr,
      settingsref: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
      bountyref: `${bountyUtxo.txHash}#${bountyUtxo.outputIndex}`,
      since: lucidBase.utils.unixTimeToSlots(now),
      until: lucidBase.utils.unixTimeToSlots(sixHoursFromNow),
      minada: Number(MIN_ADA),
      collateralref: collateralref,
      bountyid: Buffer.from(fromUnit(bountyIdTokenUnit).name!),
      mintingpolicyid: Buffer.from(fromUnit(bountyIdTokenUnit).policyId),
      rewardpolicyid: Buffer.from(rewardPolicy),
      rewardassetname: Buffer.from(rewardName),
      rewardamount: Number(rewardAmount),
    });
  } else {
    tx = await protocol.closeBeforeContributorTx({
      script: scriptAddress,
      admin: adminAddr,
      maintainer: maintainerAddr,
      settingsref: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
      bountyref: `${bountyUtxo.txHash}#${bountyUtxo.outputIndex}`,
      since: lucidBase.utils.unixTimeToSlots(now),
      until: lucidBase.utils.unixTimeToSlots(sixHoursFromNow),
      minada: Number(MIN_ADA),
      collateralref: collateralref,
      bountyid: Buffer.from(fromUnit(bountyIdTokenUnit).name!),
      mintingpolicyid: Buffer.from(fromUnit(bountyIdTokenUnit).policyId),
      rewardpolicyid: Buffer.from(rewardPolicy),
      rewardassetname: Buffer.from(rewardName),
      rewardamount: Number(rewardAmount),
    });
  }
  return {
    closeCbor: tx,
  };
}

export { closeBounty };
