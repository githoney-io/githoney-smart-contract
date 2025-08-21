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
  logger,
  lucidBase,
} from "../../utils/utils.ts";
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
  logger.info("START close");

  if (!settingsUtxo.scriptRef) {
    throw new Error("Githoney validator not found");
  }
  const scriptAddress = lucidBase.utils.scriptToAddress(settingsUtxo.scriptRef);
  const scriptHash = Addresses.scriptToCredential(settingsUtxo.scriptRef).hash;

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
    script: scriptAddress,
    admin: adminAddr,
    maintainer: maintainerAddr,
    settingsref: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
    bountyref: bountyRef,
    since: BigInt(lucidBase.utils.unixTimeToSlots(now)),
    until: BigInt(lucidBase.utils.unixTimeToSlots(sixHoursFromNow)),
    minada: BigInt(MIN_ADA),
    bountyid: Buffer.from(fromUnit(bountyIdTokenUnit).name!, "hex"),
    mintingpolicyid: Buffer.from(fromUnit(bountyIdTokenUnit).policyId, "hex"),
    rewardpolicyid: Buffer.from(rewardPolicy, "hex"),
    rewardassetname: Buffer.from(rewardName, "hex"),
    rewardamount: BigInt(rewardAmount),
  };

  let refundingsParams;
  if (Object.keys(refundings).length > 0) {
    const [sponsorAddr, refundingAssets] = Object.entries(refundings)[0];
    const [refundingUnit, refundingAmount] = Object.entries(refundingAssets)[0];
    const { policyId: refundingPolicy, assetName: refundingName } =
      fromUnit(refundingUnit);

    refundingsParams = {
      sponsor: sponsorAddr,
      refundingsamount: BigInt(refundingAmount),
      refundingsassetname: Buffer.from(refundingName!, "hex"),
      refundingspolicyid: Buffer.from(refundingPolicy, "hex"),
    };
  }

  if (bountyDatum.contributorAddress) {
    const contributorAddr = keyPairsToAddress(
      lucidBase.network,
      bountyDatum.contributorAddress,
    );
    if (refundingsParams) {
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
    if (refundingsParams) {
      ({ tx } = await protocol.closeBeforeContributorWithRewardTx({
        ...baseParams,
        ...refundingsParams,
      }));
    } else {
      ({ tx } = await protocol.closeBeforeContributorTx({ ...baseParams }));
    }
  }
  logger.info("END close");
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
