import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, Data, fromUnit, OutRef, Utxo } from "@spacebudz/lucid";
import {
  extractBountyIdTokenUnit,
  keyPairsToAddress,
  lucidBase,
  lucidWithWallet,
} from "../../utils/utils.ts";
import { sortUTxOs } from "../../utils/utxo.ts";
import { MIN_ADA, rewardFee } from "../../constants.ts";
import {
  GithoneyContractGithoneySpend,
  GithoneyContractSettingsSpend,
} from "../../plutus.ts";

async function mergeBounty(
  adminAddr: string,
  settingsUtxo: Utxo,
  utxoRef: OutRef,
): Promise<{
  assignCbor: string;
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

  const [contractUtxo] = await lucidBase.utxosByOutRef([utxoRef]);
  const bountyDatum = await lucidBase.datumOf(
    contractUtxo,
    GithoneyContractGithoneySpend.datum,
  );

  const rewardName = bountyDatum.initialValue[0].assetName;
  const rewardPolicy = bountyDatum.initialValue[0].policyId;

  const maintainerAddr = keyPairsToAddress(
    lucidBase.network,
    bountyDatum.maintainerAddress,
  );
  console.log("Maintainer Address:", maintainerAddr);

  const settings = await lucidBase.datumOf(
    settingsUtxo,
    GithoneyContractSettingsSpend.datum,
  );
  const githoneyAddr = keyPairsToAddress(
    lucidBase.network,
    settings.githoneyAddress,
  );
  console.log("Githoney Address:", githoneyAddr);

  const now = new Date().getTime() - 60;
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();

  const rewardUnit = Object.keys(contractUtxo.assets).find((unit) => {
    if (
      fromUnit(unit).policyId !== scriptHash &&
      fromUnit(unit).policyId !== "lovelace"
    ) {
      return unit;
    }
  });

  if (!rewardUnit) {
    throw new Error("No reward unit found in contract UTXO");
  }

  // REVIEW - check the amount calculation
  const githoneyFee = (contractUtxo.assets[rewardUnit] * rewardFee) / 10_000n;

  const { tx } = await protocol.mergeTx({
    admin: adminAddr,
    bountyref: `${contractUtxo.txHash}#${contractUtxo.outputIndex}`,
    collateralref: collateralref,
    githoneyaddr: githoneyAddr,
    githoneyfee: Number(githoneyFee),
    maintainer: maintainerAddr,
    minada: Number(MIN_ADA),
    rewardpolicyid: Buffer.from(rewardPolicy, "hex"),
    rewardassetname: Buffer.from(rewardName),
    script: scriptAddress,
    settingsref: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
    since: lucidBase.utils.unixTimeToSlots(now),
    until: lucidBase.utils.unixTimeToSlots(sixHoursFromNow),
  });

  return {
    assignCbor: tx,
  };
}

export { mergeBounty };
