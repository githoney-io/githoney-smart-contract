import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, paymentCredentialOf } from "@spacebudz/lucid";
import { creationFee, rewardFee, settingsTokenName } from "../../constants.ts";
import { GithoneyContractSettingsSpend } from "../../plutus.ts";
import {
  getScriptVersion,
  lucidBase,
  lucidWithWallet,
} from "../../utils/utils.ts";
import { collateralOutRef } from "../../utils/utxo.ts";

async function deploySettings(githoneyAddr: string): Promise<{
  deployCbor: string;
}> {
  const githoneyValidator = new GithoneyContractSettingsSpend();
  const scriptVersion = getScriptVersion(githoneyValidator.type);
  const scriptAddress = lucidBase.utils.scriptToAddress(githoneyValidator);
  const policyId = paymentCredentialOf(scriptAddress).hash;

  const [selectedUtxos] = await collateralOutRef(lucidWithWallet);
  const collateralref = selectedUtxos.txHash + "#" + selectedUtxos.outputIndex;

  const githoneyPaymentCred = Addresses.inspect(githoneyAddr).payment?.hash;
  const githoneyStakeCred =
    Addresses.inspect(githoneyAddr).delegation?.hash || null;

  const { tx } = await protocol.deployTx({
    script: { value: scriptAddress, type: "String" },
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
    settingspolicyid: { value: Buffer.from(policyId, "hex"), type: "Bytes" },
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
  });

  return {
    deployCbor: tx,
  };
}

export { deploySettings };
