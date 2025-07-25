import { protocol } from "../../gen/typescript/protocol.ts";
import {
  Addresses,
  Assets,
  fromUnit,
  OutRef,
  toUnit,
  Utxo,
} from "@spacebudz/lucid";
import {
  extractBountyIdTokenUnit,
  getRewardAsset,
  keyPairsToAddress,
  lucidBase,
  lucidWithWallet,
} from "../../utils/utils.ts";
import { collateralOutRef } from "../../utils/utxo.ts";
import { MIN_ADA } from "../../constants.ts";
import { GithoneyDatumSchema, InitialValue } from "../../types.ts";

async function closeBounty(
  adminAddr: string,
  refundings: { [key: string]: Assets },
  settingsUtxo: Utxo,
  utxoRef: OutRef,
): Promise<{
  closeCbor: string;
}> {
  const scriptAddress = lucidBase.utils.scriptToAddress(
    settingsUtxo.scriptRef!,
  );
  const scriptHash = Addresses.scriptToCredential(settingsUtxo.scriptRef!).hash;

  const [selectedUtxos] = await collateralOutRef(lucidWithWallet);
  const collateralref = selectedUtxos.txHash + "#" + selectedUtxos.outputIndex;

  const [bountyUtxo] = await lucidBase.utxosByOutRef([utxoRef]);
  const bountyRef = bountyUtxo.txHash + "#" + bountyUtxo.outputIndex;

  const bountyDatum = await lucidBase.datumOf(bountyUtxo, GithoneyDatumSchema);

  if (bountyDatum.merged) {
    throw new Error("Bounty already merged");
  }
  if (
    !checkRefundingsAreValid(
      refundings,
      initialValueToAssets(bountyDatum.initialValue),
      bountyUtxo.assets,
    )
  ) {
    throw new Error("Refundings are invalid");
  }

  const [sponsorAddr, refundingAssets] = Object.entries(refundings)[0];
  const [refundingUnit, refundingAmount] = Object.entries(refundingAssets)[0];
  const { policyId: refundingPolicy, assetName: refundingName } =
    fromUnit(refundingUnit);

  const now = new Date().getTime() - 60 * 1000;
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();

  const bountyIdTokenUnit = extractBountyIdTokenUnit(
    bountyUtxo.assets,
    scriptHash,
  );

  const { rewardPolicy, rewardName } = getRewardAsset(
    bountyUtxo.assets,
    scriptHash,
  );
  const initialAssets = initialValueToAssets(bountyDatum.initialValue);
  const rewardAmount = initialAssets[toUnit(rewardPolicy, rewardName)];

  const maintainerAddr = keyPairsToAddress(
    lucidBase.network,
    bountyDatum.maintainerAddress,
  );

  let tx;

  const baseParams = {
    script: { value: scriptAddress, type: "String" as const },
    admin: { value: adminAddr, type: "String" as const },
    maintainer: { value: maintainerAddr, type: "String" as const },
    settingsref: {
      value: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
      type: "String" as const,
    },
    bountyref: {
      value: bountyRef,
      type: "String" as const,
    },
    since: {
      value: BigInt(lucidBase.utils.unixTimeToSlots(now)),
      type: "Int" as const,
    },
    until: {
      value: BigInt(lucidBase.utils.unixTimeToSlots(sixHoursFromNow)),
      type: "Int" as const,
    },
    minada: { value: BigInt(MIN_ADA), type: "Int" as const },
    collateralref: { value: collateralref, type: "String" as const },
    bountyid: {
      value: Buffer.from(fromUnit(bountyIdTokenUnit).name!, "hex"),
      type: "Bytes" as const,
    },
    mintingpolicyid: {
      value: Buffer.from(fromUnit(bountyIdTokenUnit).policyId, "hex"),
      type: "Bytes" as const,
    },
    rewardpolicyid: {
      value: Buffer.from(rewardPolicy, "hex"),
      type: "Bytes" as const,
    },
    rewardassetname: {
      value: Buffer.from(rewardName, "hex"),
      type: "Bytes" as const,
    },
    rewardamount: { value: BigInt(rewardAmount), type: "Int" as const },
  };

  const refundingsParams = {
    sponsor: {
      value: sponsorAddr,
      type: "String" as const,
    },
    refundingsamount: {
      value: BigInt(refundingAmount),
      type: "Int" as const,
    },
    refundingsassetname: {
      value: Buffer.from(refundingName!, "hex"),
      type: "Bytes" as const,
    },
    refundingspolicyid: {
      value: Buffer.from(refundingPolicy, "hex"),
      type: "Bytes" as const,
    },
  };
  if (bountyDatum.contributorAddress) {
    const contributorAddr = keyPairsToAddress(
      lucidBase.network,
      bountyDatum.contributorAddress,
    );
    if (Object.keys(refundings).length > 0) {
      ({ tx } = await protocol.closeAfterContributorWithRewardTx({
        ...baseParams,
        ...refundingsParams,
        contributor: { value: contributorAddr, type: "String" },
      }));
    } else {
      ({ tx } = await protocol.closeAfterContributorTx({
        ...baseParams,
        contributor: { value: contributorAddr, type: "String" },
      }));
    }
  } else {
    if (Object.keys(refundings).length > 0) {
      ({ tx } = await protocol.closeBeforeContributorWithRewardTx({
        ...baseParams,
        ...refundingsParams,
      }));
    } else {
      ({ tx } = await protocol.closeBeforeContributorTx({ ...baseParams }));
    }
  }
  return {
    closeCbor: tx,
  };
}

export { closeBounty };

// UTILS

const initialValueToAssets = (initialValue: InitialValue): Assets => {
  let initialAssets: Assets = {};
  for (const [policy, tokens] of initialValue.entries()) {
    for (const [assetName, amount] of tokens.entries()) {
      let unit;
      if (policy === "") {
        unit = "lovelace";
      } else {
        unit = toUnit(policy, assetName);
      }
      initialAssets[unit] = amount;
    }
  }
  return initialAssets;
};

const assetsAdd = (a: Assets, b: Assets): Assets => {
  const result: Assets = {};
  for (const key of Object.keys(a)) {
    result[key] = a[key] + (b[key] || 0n);
  }
  for (const key of Object.keys(b)) {
    if (!a[key]) {
      result[key] = b[key];
    }
  }
  return clearZeroAssets(result);
};

function clearZeroAssets(assets: Assets): Assets {
  const keys = Object.keys(assets);
  for (const element of keys) {
    if (assets[element] === BigInt(0)) {
      delete assets[element];
    }
  }
  return assets;
}

const checkRefundingsAreValid = (
  refundings: { [key: string]: Assets },
  initialValue: Assets,
  assetsInUtxo: Assets,
): boolean => {
  let totalRefundings = Object.values(refundings).reduce(assetsAdd, {});
  totalRefundings = assetsAdd(totalRefundings, initialValue);
  return Object.entries(totalRefundings).every(([unit, amount]) => {
    return amount <= (assetsInUtxo[unit] || 0n);
  });
};
