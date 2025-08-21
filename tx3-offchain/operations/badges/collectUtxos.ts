import { Addresses, fromUnit, OutRef, Utxo } from "@spacebudz/lucid";
import {
  badgesValidator,
  MetadataWithPolicy,
  SettingsDatumSchema,
  settingsPolicy,
} from "../../types.ts";
import {
  logger,
  keyPairsToAddress,
  lucidBase as lucid,
  getScriptVersion,
  lucidWithWallet,
} from "../../utils/utils.ts";
import { protocol } from "../../gen/typescript/protocol.ts";
import { collateralOutRef } from "../../utils/utxo.ts";
import { signSubmitAndWaitConfirmation } from "../../test/utils.ts";
import { githoneySeed } from "../../constants.ts";

/**
 * Collects Utxos from the badges script address avoiding the ones holding some specific metadata.
 * @param settingsUtxo The settings Utxo.
 * @param settingsNftOutRef The output reference passed as a parameter of the settings nft minting policy,
 * @param metadatas The metadata of the badges to be skipped from collection.
 */

async function collectUtxos(
  settingsUtxo: Utxo,
  settingsNftOutRef: OutRef,
  metadatas: MetadataWithPolicy[],
) {
  logger.info("START collectUtxos");
  const settings = await lucid.datumOf(settingsUtxo, SettingsDatumSchema);
  const settingsRef = settingsUtxo.txHash + "#" + settingsUtxo.outputIndex;

  const [selectedUtxos] = await collateralOutRef(lucidWithWallet);
  const collateralref = selectedUtxos.txHash + "#" + selectedUtxos.outputIndex;

  const settingsMintingPolicy = settingsPolicy(settingsNftOutRef);
  const settingsNftPolicy = Addresses.scriptToCredential(
    settingsMintingPolicy,
  ).hash;
  const badgesScript = badgesValidator(settingsNftPolicy);
  const scriptAddr = Addresses.scriptToAddress(lucid.network, badgesScript);
  logger.info(`Collecting utxos from ${scriptAddr}`);

  const utxosAtScript = await lucid.utxosAt(scriptAddr);

  const githoneyAddr = keyPairsToAddress(
    lucid.network,
    settings.githoneyAddress,
  );
  lucid.selectReadOnlyWallet({ address: githoneyAddr });

  const policiesToAvoid: string[] = [];
  for (const meta of metadatas) {
    if (meta.policyId) {
      policiesToAvoid.push(meta.policyId);
    }
  }
  const inputUtxos: Utxo[] = [];
  let tx: string;
  utxosAtScript.forEach(async (utxo) => {
    if (
      Object.keys(utxo.assets).some((unit) => {
        const { policyId } = fromUnit(unit);
        return policiesToAvoid.includes(policyId);
      })
    ) {
      return;
    }
    console.log("Collecting UTxO:", utxo);
    inputUtxos.push(utxo);
    ({ tx } = await protocol.collectUtxosTx({
      badgesscript: {
        type: "String",
        value: badgesScript.script,
      },
      badgesscriptversion: getScriptVersion(badgesScript.type),
      githoneyaddr: githoneyAddr,
      settingsref: settingsRef,
      collateralref: collateralref,
      utxotocollect: utxo.txHash + "#" + utxo.outputIndex,
    }));

    lucid.selectWalletFromSeed(githoneySeed);
    await signSubmitAndWaitConfirmation(tx, lucid);
  });

  if (inputUtxos.length === 0) {
    logger.info("No input UTxOs found");
    return "";
  } else {
    logger.info("All UTxOs collected");
  }
  logger.info("END collectUtxos");
}

export { collectUtxos };
