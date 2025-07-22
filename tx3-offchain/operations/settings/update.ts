import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, fromUnit, Utxo } from "@spacebudz/lucid";
import { creationFee, rewardFee } from "../../constants.ts";
import {
  GithoneyContractGithoneySpend,
  GithoneyContractSettingsSpend,
} from "../../plutus.ts";
import { lucidBase, lucidWithWallet } from "../../utils/utils.ts";
import { collateralOutRef } from "../../utils/utxo.ts";

async function updateSettings(
  settingsUtxo: Utxo,
  settings?: {
    githoneyAddress?: string;
    creationFee: bigint;
    rewardFee: bigint;
  },
): Promise<{
  updateCbor: string;
}> {
  const script = new GithoneyContractSettingsSpend();
  const scriptAddress = lucidBase.utils.scriptToAddress(script);

  // TODO - apply params to script
  // const settingsPolicyId = fromUnit(
  //   Object.keys(settingsUtxo.assets).find((unit) => {
  //     return unit !== "lovelace";
  //   })!,
  // ).policyId;

  // const gitHoneyValidator = new GithoneyContractGithoneySpend(settingsPolicyId);

  const [selectedUtxos] = await collateralOutRef(lucidWithWallet);
  const collateralref = selectedUtxos.txHash + "#" + selectedUtxos.outputIndex;
  const settingsRef = settingsUtxo.txHash + "#" + settingsUtxo.outputIndex;

  const oldSettings = await lucidBase.datumOf(
    settingsUtxo,
    GithoneyContractSettingsSpend.datum,
  );

  let githoneyAddress, bountyCreationFee, bountyRewardFee;
  if (!settings) {
    githoneyAddress = oldSettings.githoneyAddress;
    bountyCreationFee = creationFee;
    bountyRewardFee = rewardFee;
  } else {
    if (settings.rewardFee < 0n || settings.rewardFee > 10_000n) {
      throw new Error("Reward fee must be between 0 and 10000");
    }
    if (settings.creationFee < 2_000_000n) {
      throw new Error("Creation fee must be at least 2 ADA");
    }
    githoneyAddress = settings.githoneyAddress;
    bountyCreationFee = settings.creationFee;
    bountyRewardFee = settings.rewardFee;
  }

  const githoneyPaymentCred = Addresses.inspect(githoneyAddress).payment?.hash;
  const githoneyStakeCred =
    Addresses.inspect(githoneyAddress).delegation?.hash || null;

  const { tx } = await protocol.updateTx({
    script: { value: scriptAddress, type: "String" },
    githoneyaddr: { value: githoneyAddress, type: "String" },
    githoneypaymentcredential: {
      value: Buffer.from(githoneyPaymentCred!, "hex"),
      type: "Bytes",
    },
    githoneystakingcredential: {
      value: Buffer.from(githoneyStakeCred!, "hex"),
      type: "Bytes",
    },
    bountycreationfee: { value: BigInt(bountyCreationFee), type: "Int" },
    bountyrewardfee: { value: BigInt(bountyRewardFee), type: "Int" },
    collateralref: { value: collateralref, type: "String" },
    settingsref: {
      value: settingsRef,
      type: "String",
    },
  });

  return {
    updateCbor: tx,
  };
}

export { updateSettings };
