import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, fromUnit, OutRef, Utxo } from "@spacebudz/lucid";
import {
  extractBountyIdTokenUnit,
  keyPairsToAddress,
  lucidBase,
  lucidWithWallet,
} from "../../utils/utils.ts";
import { sortUTxOs } from "../../utils/utxo.ts";
import { MIN_ADA } from "../../constants.ts";
import { GithoneyContractGithoneySpend } from "../../plutus.ts";

async function claimBounty(
  settingsUtxo: Utxo,
  utxoRef: OutRef,
): Promise<{
  claimCbor: string;
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

  const [bountyUtxo] = await lucidBase.utxosByOutRef([utxoRef]);
  const bountyDatum = await lucidBase.datumOf(
    bountyUtxo,
    GithoneyContractGithoneySpend.datum,
  );

  if (!bountyDatum.contributorAddress) {
    throw new Error("Bounty doesn't have a contributor");
  }
  if (!bountyDatum.merged) {
    throw new Error("Bounty is not merged");
  }
  const contributorAddr = keyPairsToAddress(
    lucidBase.network,
    bountyDatum.contributorAddress,
  );

  const now = new Date().getTime() - 60;
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();

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

  const tx = await protocol.claimTx({
    bountyid: Buffer.from(fromUnit(bountyIdTokenUnit).name!),
    bountyref: `${bountyUtxo.txHash}#${bountyUtxo.outputIndex}`,
    collateralref: collateralref,
    contributor: contributorAddr,
    minada: Number(MIN_ADA),
    mintingpolicyid: Buffer.from(fromUnit(bountyIdTokenUnit).policyId),
    rewardamount: Number(bountyUtxo.assets[rewardUnit]),
    rewardassetname: Buffer.from(fromUnit(rewardUnit).name!),
    rewardpolicyid: Buffer.from(fromUnit(rewardUnit).policyId),
    script: scriptAddress,
    settingsref: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
    since: lucidBase.utils.unixTimeToSlots(now),
    until: lucidBase.utils.unixTimeToSlots(sixHoursFromNow),
  });

  return {
    claimCbor: tx,
  };
}

export { claimBounty };
