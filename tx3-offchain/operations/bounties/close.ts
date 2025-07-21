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
import {
  GithoneyContractGithoneySpend,
  PairsCardanoAssetsPolicyIdPairsCardanoAssetsAssetNameInt,
} from "../../plutus.ts";

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

  const bountyDatum = await lucidBase.datumOf(
    bountyUtxo,
    GithoneyContractGithoneySpend.datum,
  );

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

  if (bountyDatum.contributorAddress) {
    const contributorAddr = keyPairsToAddress(
      lucidBase.network,
      bountyDatum.contributorAddress,
    );
    if (Object.keys(refundings).length > 0) {
      ({ tx } = await protocol.closeAfterContributorWithRewardTx({
        script: { value: scriptAddress, type: "String" },
        contributor: { value: contributorAddr, type: "String" },
        admin: { value: adminAddr, type: "String" },
        maintainer: { value: maintainerAddr, type: "String" },
        settingsref: {
          value: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
          type: "String",
        },
        bountyref: {
          value: `${bountyUtxo.txHash}#${bountyUtxo.outputIndex}`,
          type: "String",
        },
        since: {
          value: BigInt(lucidBase.utils.unixTimeToSlots(now)),
          type: "Int",
        },
        until: {
          value: BigInt(lucidBase.utils.unixTimeToSlots(sixHoursFromNow)),
          type: "Int",
        },
        minada: { value: BigInt(MIN_ADA), type: "Int" },
        collateralref: { value: collateralref, type: "String" },
        bountyid: {
          value: Buffer.from(fromUnit(bountyIdTokenUnit).name!, "hex"),
          type: "Bytes",
        },
        mintingpolicyid: {
          value: Buffer.from(fromUnit(bountyIdTokenUnit).policyId, "hex"),
          type: "Bytes",
        },
        rewardpolicyid: {
          value: Buffer.from(rewardPolicy, "hex"),
          type: "Bytes",
        },
        rewardassetname: {
          value: Buffer.from(rewardName, "hex"),
          type: "Bytes",
        },
        rewardamount: { value: BigInt(rewardAmount), type: "Int" },
        sponsor: {
          value: sponsorAddr,
          type: "String",
        },
        refundingsamount: {
          value: BigInt(refundingAmount),
          type: "Int",
        },
        refundingsassetname: {
          value: Buffer.from(refundingName!, "hex"),
          type: "Bytes",
        },
        refundingspolicyid: {
          value: Buffer.from(refundingPolicy, "hex"),
          type: "Bytes",
        },
      }));
    } else {
      ({ tx } = await protocol.closeAfterContributorTx({
        script: { value: scriptAddress, type: "String" },
        contributor: { value: contributorAddr, type: "String" },
        admin: { value: adminAddr, type: "String" },
        maintainer: { value: maintainerAddr, type: "String" },
        settingsref: {
          value: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
          type: "String",
        },
        bountyref: {
          value: `${bountyUtxo.txHash}#${bountyUtxo.outputIndex}`,
          type: "String",
        },
        since: {
          value: BigInt(lucidBase.utils.unixTimeToSlots(now)),
          type: "Int",
        },
        until: {
          value: BigInt(lucidBase.utils.unixTimeToSlots(sixHoursFromNow)),
          type: "Int",
        },
        minada: { value: BigInt(MIN_ADA), type: "Int" },
        collateralref: { value: collateralref, type: "String" },
        bountyid: {
          value: Buffer.from(fromUnit(bountyIdTokenUnit).name!, "hex"),
          type: "Bytes",
        },
        mintingpolicyid: {
          value: Buffer.from(fromUnit(bountyIdTokenUnit).policyId, "hex"),
          type: "Bytes",
        },
        rewardpolicyid: {
          value: Buffer.from(rewardPolicy, "hex"),
          type: "Bytes",
        },
        rewardassetname: {
          value: Buffer.from(rewardName, "hex"),
          type: "Bytes",
        },
        rewardamount: { value: BigInt(rewardAmount), type: "Int" },
      }));
    }
  } else {
    ({ tx } = await protocol.closeBeforeContributorTx({
      script: { value: scriptAddress, type: "String" },
      admin: { value: adminAddr, type: "String" },
      maintainer: { value: maintainerAddr, type: "String" },
      settingsref: {
        value: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
        type: "String",
      },
      bountyref: {
        value: bountyRef,
        type: "String",
      },
      since: {
        value: BigInt(lucidBase.utils.unixTimeToSlots(now)),
        type: "Int",
      },
      until: {
        value: BigInt(lucidBase.utils.unixTimeToSlots(sixHoursFromNow)),
        type: "Int",
      },
      minada: { value: BigInt(MIN_ADA), type: "Int" },
      collateralref: { value: collateralref, type: "String" },
      bountyid: {
        value: Buffer.from(fromUnit(bountyIdTokenUnit).name!, "hex"),
        type: "Bytes",
      },
      mintingpolicyid: {
        value: Buffer.from(fromUnit(bountyIdTokenUnit).policyId, "hex"),
        type: "Bytes",
      },
      rewardpolicyid: {
        value: Buffer.from(rewardPolicy, "hex"),
        type: "Bytes",
      },
      rewardassetname: { value: Buffer.from(rewardName, "hex"), type: "Bytes" },
      rewardamount: { value: BigInt(rewardAmount), type: "Int" },
    }));
  }
  return {
    closeCbor: tx,
  };
}

export { closeBounty };

// UTILS

type InitialValue = PairsCardanoAssetsPolicyIdPairsCardanoAssetsAssetNameInt;

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
