import {
  githoneyValidator,
  settingsValidator,
  settingsPolicy
} from "../../scripts";
import { Data, Lucid, OutRef, fromText, toUnit } from "lucid-txpipe";
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
  const settingsValidatorAddress = lucid.utils.validatorToAddress(
    settingsValidatorScript
  );
  const utxo = (await lucid.utxosAt(githoneyAddr))[0];
  const outRef = {
    txHash: utxo.txHash,
    outputIndex: utxo.outputIndex
  };
  const settingsMintingPolicy = settingsPolicy(outRef);

  const settingsPolicyId = lucid.utils.mintingPolicyToId(settingsMintingPolicy);
  logger.info(`settingsPolicyId: ${settingsPolicyId}`);
  const settingsNFTUnit = toUnit(settingsPolicyId, fromText(settingsTokenName));

  const settingsDatum = mkSettingsDatum(validatorSettings(lucid));
  const gitHoneyValidator = githoneyValidator(settingsPolicyId);

  lucid.selectWalletFrom({ address: githoneyAddr });

  const tx = await lucid
    .newTx()
    .collectFrom([utxo])
    .payToContract(
      settingsValidatorAddress,
      { scriptRef: gitHoneyValidator, inline: settingsDatum },
      { [settingsNFTUnit]: 1n }
    )
    .mintAssets({ [settingsNFTUnit]: 1n }, Data.void())
    .attachMintingPolicy(settingsMintingPolicy)
    .complete();

  const cbor = tx.toString();
  logger.info("END deploy");
  logger.info(`Deploy: ${cbor}`);
  return { cbor, outRef };
}

export { deploySettings };
