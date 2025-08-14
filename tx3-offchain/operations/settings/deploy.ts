import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, OutRef } from "@spacebudz/lucid";
import { creationFee, rewardFee, settingsTokenName } from "../../constants.ts";
import {
  getScriptVersion,
  logger,
  lucidBase,
  lucidWithWallet,
} from "../../utils/utils.ts";
import { collateralOutRef, sortUTxOs } from "../../utils/utxo.ts";
import {
  settingsValidator,
  githoneyValidator,
  settingsPolicy,
} from "../../types.ts";

async function deploySettings(
  githoneyAddr: string,
): Promise<{ deployCbor: string; outRef: OutRef }> {
  logger.info("START deploy");

  const settingsValidatorScript = settingsValidator();
  const settingsValidatorAddress = Addresses.scriptToAddress(
    lucidBase.network,
    settingsValidatorScript,
  );
  const settingsValidatorCredential = Addresses.scriptToCredential(
    settingsValidatorScript,
  );
  if (!settingsValidatorCredential) {
    throw new Error(
      "Settings validator address does not have a payment credential",
    );
  }

  const [utxo] = await lucidWithWallet.wallet
    .getUtxos()
    .then((utxos) => {
      return utxos.filter(
        (utxo) =>
          utxo.assets["lovelace"] >= 50_000_000 &&
          Object.keys(utxo.assets).length === 1,
      );
    })
    .then((utxos) => sortUTxOs(utxos, "Canonical"));

  const outRef: OutRef = {
    txHash: utxo.txHash,
    outputIndex: utxo.outputIndex,
  };

  const settingsMintingPolicy = settingsPolicy(outRef);
  const settingsPolicyId = Addresses.scriptToCredential(settingsMintingPolicy);

  const gitHoneyValidator = githoneyValidator(settingsPolicyId.hash);
  const scriptVersion = getScriptVersion(gitHoneyValidator.type);
  const settingsMintingVersion = getScriptVersion(settingsMintingPolicy.type);

  const [selectedUtxos] = await collateralOutRef(lucidWithWallet);
  const collateralref = selectedUtxos.txHash + "#" + selectedUtxos.outputIndex;

  const githoneyPaymentCred = Addresses.inspect(githoneyAddr).payment?.hash;
  const githoneyStakeCred =
    Addresses.inspect(githoneyAddr).delegation?.hash || null;

  const { tx } = await protocol.deployTx({
    script: settingsValidatorAddress,
    githoneyaddr: githoneyAddr,
    githoneypaymentcredential: Buffer.from(githoneyPaymentCred!, "hex"),
    githoneystakingcredential: Buffer.from(githoneyStakeCred!, "hex"),
    bountycreationfee: BigInt(creationFee),
    bountyrewardfee: BigInt(rewardFee),
    settingsmintingpolicy: Buffer.from(settingsMintingPolicy.script, "hex"),
    settingspolicyid: Buffer.from(settingsPolicyId.hash, "hex"),
    settingstokenname: Buffer.from(settingsTokenName),
    collateralref: collateralref,
    githoneyscript: Buffer.from(gitHoneyValidator.script, "hex"),
    scriptversion: scriptVersion,
    settingsmintingversion: settingsMintingVersion,
    utxoref: outRef.txHash + "#" + outRef.outputIndex,
  });

  logger.info("END deploy");
  return {
    deployCbor: tx,
    outRef,
  };
}

export { deploySettings };
