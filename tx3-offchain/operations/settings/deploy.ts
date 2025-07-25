import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, OutRef } from "@spacebudz/lucid";
import { creationFee, rewardFee, settingsTokenName } from "../../constants.ts";
import {
  GithoneyContractGithoneySpend,
  GithoneyContractSettingsMintingMint,
  GithoneyContractSettingsSpend,
} from "../../plutus.ts";
import {
  getScriptVersion,
  lucidBase,
  lucidWithWallet,
} from "../../utils/utils.ts";
import { collateralOutRef, sortUTxOs } from "../../utils/utxo.ts";

async function deploySettings(
  githoneyAddr: string,
): Promise<{ deployCbor: string; outRef: OutRef }> {
  const settingsValidatorScript = new GithoneyContractSettingsSpend();
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
  const outRefParam = {
    transactionId: utxo.txHash,
    outputIndex: BigInt(utxo.outputIndex),
  };

  const settingsMintingPolicy = new GithoneyContractSettingsMintingMint(
    outRefParam,
    {
      paymentCredential: { Script: [settingsValidatorCredential.hash] },
      stakeCredential: null,
    },
  );

  const settingsPolicyId = Addresses.scriptToCredential(settingsMintingPolicy);

  const githoneyValidator = new GithoneyContractGithoneySpend(
    settingsPolicyId.hash,
  );
  const scriptVersion = getScriptVersion(githoneyValidator.type);
  const settingsMintingVersion = getScriptVersion(settingsMintingPolicy.type);

  const [selectedUtxos] = await collateralOutRef(lucidWithWallet);
  const collateralref = selectedUtxos.txHash + "#" + selectedUtxos.outputIndex;

  const githoneyPaymentCred = Addresses.inspect(githoneyAddr).payment?.hash;
  const githoneyStakeCred =
    Addresses.inspect(githoneyAddr).delegation?.hash || null;

  const { tx } = await protocol.deployTx({
    script: { value: settingsValidatorAddress, type: "String" },
    githoneyaddr: { value: githoneyAddr, type: "String" },
    githoneypaymentcredential: {
      value: Buffer.from(githoneyPaymentCred!, "hex"),
      type: "Bytes",
    },
    githoneystakingcredential: {
      value: Buffer.from(githoneyStakeCred!, "hex"),
      type: "Bytes",
    },
    bountycreationfee: { value: BigInt(creationFee), type: "Int" },
    bountyrewardfee: { value: BigInt(rewardFee), type: "Int" },
    settingsmintingpolicy: {
      value: settingsMintingPolicy.script,
      type: "String",
    },
    settingspolicyid: {
      value: Buffer.from(settingsPolicyId.hash, "hex"),
      type: "Bytes",
    },
    settingstokenname: { value: Buffer.from(settingsTokenName), type: "Bytes" },
    collateralref: { value: collateralref, type: "String" },
    githoneyscript: {
      value: githoneyValidator.script,
      type: "String",
    },
    scriptversion: {
      value: BigInt(scriptVersion),
      type: "Int",
    },
    settingsmintingversion: {
      value: BigInt(settingsMintingVersion),
      type: "Int",
    },
    utxoref: {
      type: "String",
      value: outRef.txHash + "#" + outRef.outputIndex,
    },
  });

  return {
    deployCbor: tx,
    outRef,
  };
}

export { deploySettings };
