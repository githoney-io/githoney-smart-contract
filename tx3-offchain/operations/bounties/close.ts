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

  const now = new Date().getTime() - 60 * 1000;
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
    ({ tx } = await protocol.closeAfterContributorTx({
      script: { value: scriptAddress, type: "String" },
      contributor: { value: contributorAddr, type: "String" },
      admin: { value: adminAddr, type: "String" },
      maintainer: { value: maintainerAddr, type: "String" },
      settingsref: {
        value: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
        type: "String",
      },
      bountyref: {
        value: `${bountyUtxo.txHash}#${bountyUtxo.outputIndex}`,
        type: "String",
      },
      since: {
        value: BigInt(lucidBase.utils.unixTimeToSlots(now)),
        type: "Int",
      },
      until: {
        value: BigInt(lucidBase.utils.unixTimeToSlots(sixHoursFromNow)),
        type: "Int",
      },
      minada: { value: BigInt(MIN_ADA), type: "Int" },
      collateralref: { value: collateralref, type: "String" },
      bountyid: {
        value: Buffer.from(fromUnit(bountyIdTokenUnit).name!, "hex"),
        type: "Bytes",
      },
      mintingpolicyid: {
        value: Buffer.from(fromUnit(bountyIdTokenUnit).policyId, "hex"),
        type: "Bytes",
      },
      rewardpolicyid: {
        value: Buffer.from(rewardPolicy, "hex"),
        type: "Bytes",
      },
      rewardassetname: { value: Buffer.from(rewardName, "hex"), type: "Bytes" },
      rewardamount: { value: BigInt(rewardAmount), type: "Int" },
    }));
  } else {
    ({ tx } = await protocol.closeBeforeContributorTx({
      script: { value: scriptAddress, type: "String" },
      admin: { value: adminAddr, type: "String" },
      maintainer: { value: maintainerAddr, type: "String" },
      settingsref: {
        value: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
        type: "String",
      },
      bountyref: {
        value: `${bountyUtxo.txHash}#${bountyUtxo.outputIndex}`,
        type: "String",
      },
      since: {
        value: BigInt(lucidBase.utils.unixTimeToSlots(now)),
        type: "Int",
      },
      until: {
        value: BigInt(lucidBase.utils.unixTimeToSlots(sixHoursFromNow)),
        type: "Int",
      },
      minada: { value: BigInt(MIN_ADA), type: "Int" },
      collateralref: { value: collateralref, type: "String" },
      bountyid: {
        value: Buffer.from(fromUnit(bountyIdTokenUnit).name!, "hex"),
        type: "Bytes",
      },
      mintingpolicyid: {
        value: Buffer.from(fromUnit(bountyIdTokenUnit).policyId, "hex"),
        type: "Bytes",
      },
      rewardpolicyid: {
        value: Buffer.from(rewardPolicy, "hex"),
        type: "Bytes",
      },
      rewardassetname: { value: Buffer.from(rewardName, "hex"), type: "Bytes" },
      rewardamount: { value: BigInt(rewardAmount), type: "Int" },
    }));
  }
  return {
    closeCbor: tx,
  };
}

export { closeBounty };
