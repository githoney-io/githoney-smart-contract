import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, Utxo } from "@spacebudz/lucid";
import { MIN_ADA } from "../../constants.ts";
import {
  keyPairsToAddress,
  logger,
  lucidBase,
  lucidWithWallet,
} from "../../utils/utils.ts";
import { collateralOutRef } from "../../utils/utxo.ts";
import { SettingsDatumSchema } from "../../types.ts";

async function createBounty(
  rewardPolicy: string,
  rewardName: string,
  rewardAmount: bigint,
  bountyId: string,
  maintainerAddr: string,
  adminAddr: string,
  settingsUtxo: Utxo,
  deadline: bigint,
): Promise<{
  createCbor: string;
}> {
  logger.info("START create");

  if (!settingsUtxo.scriptRef) {
    throw new Error("Githoney validator not found");
  }
  const scriptAddress = lucidBase.utils.scriptToAddress(settingsUtxo.scriptRef);
  const scriptHash = Addresses.scriptToCredential(settingsUtxo.scriptRef).hash;

  const selectedUtxos = await collateralOutRef(lucidWithWallet);

  const collateralref = {
    txid: Buffer.from(selectedUtxos[0].txHash, "hex"),
    index: selectedUtxos[0].outputIndex,
  };

  const now = new Date().getTime() - 60 * 1000; // 1 minute ago
  const tomorrow = new Date(now + 1000 * 60 * 60 * 24 * 1).getTime();

  const settings = await lucidBase.datumOf(settingsUtxo, SettingsDatumSchema);

  if (settings.bountyRewardFee < 0n || settings.bountyRewardFee > 10_000n) {
    throw new Error("Reward fee must be between 0 and 10000");
  }
  if (BigInt(settings.bountyCreationFee) < 2_000_000n) {
    throw new Error("Creation fee must be at least 2 ADA");
  }
  if (deadline < tomorrow) {
    throw new Error("Deadline must be at least 24 hours from now");
  }
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();

  const maintainerPaymentCred = Addresses.inspect(maintainerAddr).payment?.hash;
  const maintainerStakeCred =
    Addresses.inspect(maintainerAddr).delegation?.hash || null;
  const adminPaymentCred = Addresses.inspect(adminAddr).payment?.hash;
  const githoneyAddr = keyPairsToAddress(
    lucidBase.network,
    settings.githoneyAddress,
  );

  const createParams = {
    adminpaymentcredential: {
      value: new Uint8Array(Buffer.from(adminPaymentCred!, "hex")),
      type: "Bytes" as const,
    },
    bountycreationfee: {
      value: settings.bountyCreationFee,
      type: "Int" as const,
    },
    bountyid: {
      value: new Uint8Array(Buffer.from(bountyId)),
      type: "Bytes" as const,
    },
    bountyrewardfee: { value: settings.bountyRewardFee, type: "Int" as const },
    collateralref: { value: collateralref, type: "UtxoRef" as const },
    githoneyaddr: { value: githoneyAddr, type: "String" as const },
    maintainer: { value: maintainerAddr, type: "String" as const },
    maintainerpaymentcredential: {
      value: new Uint8Array(Buffer.from(maintainerPaymentCred!, "hex")),
      type: "Bytes" as const,
    },
    maintainerstakecredential: {
      value: new Uint8Array(Buffer.from(maintainerStakeCred!, "hex")),
      type: "Bytes" as const,
    },
    minada: { value: MIN_ADA, type: "Int" as const },
    mintingpolicyid: {
      value: new Uint8Array(Buffer.from(scriptHash, "hex")),
      type: "Bytes" as const,
    },
    rewardamount: { value: rewardAmount, type: "Int" as const },
    script: { value: scriptAddress, type: "String" as const },
    settingsref: {
      value: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
      type: "String" as const,
    },
    since: {
      value: BigInt(lucidBase.utils.unixTimeToSlots(now)),
      type: "Int" as const,
    },
    timelimit: { value: deadline, type: "Int" as const },
    until: {
      value: BigInt(lucidBase.utils.unixTimeToSlots(sixHoursFromNow)),
      type: "Int" as const,
    },
  };

  let tx;
  if (rewardPolicy === "lovelace" || rewardPolicy === "") {
    ({ tx } = await protocol.createWithLovelaceTx({
      ...createParams,
    }));
  } else {
    ({ tx } = await protocol.createWithTokenTx({
      ...createParams,
      rewardassetname: {
        value: Buffer.from(rewardName),
        type: "Bytes",
      },
      rewardpolicyid: {
        value: Buffer.from(rewardPolicy, "hex"),
        type: "Bytes",
      },
    }));
  }

  logger.info("END create");
  return {
    createCbor: tx,
  };
}

export { createBounty };
