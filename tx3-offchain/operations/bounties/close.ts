import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, Assets, Data, fromUnit, Utxo } from "@spacebudz/lucid";
import { lucidBase, lucidWithWallet } from "../../utils/utils.ts";
import { sortUTxOs } from "../../utils/utxo.ts";
import { MIN_ADA } from "../../constants.ts";
import { GithoneyContractGithoneySpend } from "../../plutus.ts";

function extractBountyIdTokenUnit(
  assets: Assets,
  mintingPolicyid: string,
): string {
  let bountyIdTokenUnit = "";
  Object.keys(assets).forEach((unit) => {
    if (mintingPolicyid === fromUnit(unit).policyId) {
      bountyIdTokenUnit = unit;
    }
  });
  return bountyIdTokenUnit;
}

async function closeBounty(
  adminAddr: string,
  maintainerAddr: string,
  contributorAddr: string,
  settingsUtxo: Utxo,
  bountyUtxo: Utxo,
): Promise<{
  closeCbor: string;
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

  if (!bountyUtxo.datum) {
    throw new Error("Bounty UTXO datum is undefined");
  }

  const now = new Date().getTime() - 60;
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();

  const datum = Data.from(
    bountyUtxo.datum,
    GithoneyContractGithoneySpend.datum,
  );

  const bountyIdTokenUnit = extractBountyIdTokenUnit(
    bountyUtxo.assets,
    scriptHash,
  );

  const rewardUnit = Object.keys(bountyUtxo.assets).find((unit) => {
    if (
      fromUnit(unit).policyId !== scriptHash &&
      fromUnit(unit).policyId !== "lovelace"
    ) {
      return unit;
    }
  });

  if (!rewardUnit) {
    throw new Error("No reward unit found in bounty UTXO");
  }

  let tx;

  if (datum.contributorAddress) {
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
      rewardpolicyid: Buffer.from(fromUnit(rewardUnit).policyId),
      rewardassetname: Buffer.from(fromUnit(rewardUnit).name!),
      rewardamount: Number(bountyUtxo.assets[rewardUnit]),
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
      rewardpolicyid: Buffer.from(fromUnit(rewardUnit).policyId),
      rewardassetname: Buffer.from(fromUnit(rewardUnit).name!),
      rewardamount: Number(bountyUtxo.assets[rewardUnit]),
    });
  }
  return {
    closeCbor: tx,
  };
}

export { closeBounty };
