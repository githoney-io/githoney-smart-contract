import {
  githoneyValidator,
  settingsValidator,
  settingsPolicy
} from "../../scripts";
import {
  Addresses,
  Data,
  Lucid,
  OutRef,
  fromText,
  toUnit
} from "@spacebudz/lucid";
import { validatorSettings } from "../../utils";
import logger from "../../logger";
import { settingsTokenName } from "../../constants";
import { mkSettingsDatum } from "../../types";

/**
 * Builds a `deploy` transaction. The tx is built in the context of the GitHoney address. This transaction configures the global parameters of the dApp, including the creation fee, reward fee, and the GitHoney wallet. These parameters are obtained from the environment configuration.
 * @param githoneyAddr The GitHoney bech32 address.
 * @param lucid Lucid instance.
 * @returns The cbor of the unsigned transaction and an output reference from the associated wallet.
 */

async function deploySettings(
  githoneyAddr: string,
  lucid: Lucid
): Promise<{ cbor: string; outRef: OutRef }> {
  logger.info("START deploy");
  const settingsValidatorScript = settingsValidator();
  const settingsValidatorAddress = Addresses.scriptToAddress(
    lucid.network,
    settingsValidatorScript
  );
  const utxo = (await lucid.utxosAt(githoneyAddr))[0];
  const outRef = {
    txHash: utxo.txHash,
    outputIndex: utxo.outputIndex
  };
  const settingsMintingPolicy = settingsPolicy(outRef, lucid);

  const settingsPolicyId = Addresses.scriptToCredential(settingsMintingPolicy);
  logger.info(`settingsPolicyId: ${settingsPolicyId.hash}`);
  const settingsNFTUnit = toUnit(
    settingsPolicyId.hash,
    fromText(settingsTokenName)
  );

  const settingsDatum = mkSettingsDatum(validatorSettings(githoneyAddr));
  const gitHoneyValidator = githoneyValidator(settingsPolicyId.hash);

  lucid.selectReadOnlyWallet({ address: githoneyAddr });

  const tx = await lucid
    .newTx()
    .collectFrom([utxo])
    .payToContract(
      settingsValidatorAddress,
      { scriptRef: gitHoneyValidator, Inline: settingsDatum },
      { [settingsNFTUnit]: 1n }
    )
    .mint({ [settingsNFTUnit]: 1n }, Data.void())
    .attachScript(settingsMintingPolicy)
    .commit();

  const cbor = tx.toString();
  logger.info("END deploy");
  logger.info(`Deploy: ${cbor}`);
  return { cbor, outRef };
}

export { deploySettings };
