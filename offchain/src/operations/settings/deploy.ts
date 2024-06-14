import {
  githoneyValidator,
  settingsValidator,
  settingsPolicy
} from "../../scripts";
import { Lucid, toUnit } from "lucid-cardano";
import { addrToWallet, validatorParams } from "../../utils";
import logger from "../../logger";
import { githoneyAddr, settingsTokenName } from "../../constants";
import { mkSettingsDatum } from "../../types";

async function deploy(lucid: Lucid) {
  logger.info("START deploy");
  const settingsValidatorScript = settingsValidator();
  const settingsValidatorAddress = lucid.utils.validatorToAddress(
    settingsValidatorScript
  );
  const utxo = (await lucid.utxosAt(githoneyAddr))[0];
  const settingsMintingPolicy = settingsPolicy(
    {
      txHash: utxo.txHash,
      outputIndex: utxo.outputIndex
    },
    addrToWallet(settingsValidatorAddress, lucid)
  );

  const settingsPolicyId = lucid.utils.mintingPolicyToId(settingsMintingPolicy);
  const settingsNFTUnit = toUnit(settingsPolicyId, settingsTokenName);

  const settingsDatum = mkSettingsDatum(validatorParams(lucid));
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
    .mintAssets({ [settingsNFTUnit]: 1n })
    .attachMintingPolicy(settingsMintingPolicy)
    .complete();

  const cbor = tx.toString();
  logger.info("END deploy");
  logger.info(`Deploy: ${cbor}`);
  return cbor;
}

export { deploy };
