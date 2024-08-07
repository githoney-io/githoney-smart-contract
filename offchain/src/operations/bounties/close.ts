import { Assets, Data, Lucid, OutRef, toUnit, Tx, UTxO } from "lucid-cardano";
import {
  GithoneyDatum,
  GithoneyDatumT,
  GithoneyValidatorRedeemer
} from "../../types";
import {
  clearZeroAssets,
  extractBountyIdTokenUnit,
  keyPairsToAddress
} from "../../utils";
import { MIN_ADA } from "../../constants";
import logger from "../../logger";

async function closeBounty(
  settingsUtxo: UTxO,
  utxoRef: OutRef,
  refundings: { [key: string]: Assets },
  lucid: Lucid
): Promise<string> {
  logger.info("START close");

  const githoneyScript = settingsUtxo.scriptRef;
  if (!githoneyScript) {
    throw new Error("Githoney validator not found");
  }
  const mintingPolicyid = lucid.utils.mintingPolicyToId(githoneyScript);
  const [utxo] = await lucid.utxosByOutRef([utxoRef]);
  const bountyDatum: GithoneyDatumT = await lucid.datumOf(utxo, GithoneyDatum);

  if (bountyDatum.merged) {
    throw new Error("Bounty already merged");
  }
  if (
    !checkRefundingsAreValid(
      refundings,
      initialValueToAssets(bountyDatum.initial_value),
      utxo.assets
    )
  ) {
    throw new Error("Refundings are invalid");
  }

  const adminAddr = await keyPairsToAddress(lucid, bountyDatum.admin);
  const bountyIdTokenUnit = extractBountyIdTokenUnit(
    utxo.assets,
    mintingPolicyid
  );

  lucid.selectWalletFrom({ address: adminAddr });
  const adminPkh =
    lucid.utils.getAddressDetails(adminAddr).paymentCredential?.hash!;
  const now = new Date();
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const tx = lucid
    .newTx()
    .readFrom([settingsUtxo])
    .validTo(sixHoursFromNow.getTime())
    .collectFrom([utxo], GithoneyValidatorRedeemer.Close())
    .mintAssets({ [bountyIdTokenUnit]: BigInt(-1) }, Data.void())
    .addSignerKey(adminPkh);

  const txWithPayments = await (
    await addPayments(tx, bountyDatum, utxo.assets, refundings, lucid)
  ).complete();

  const cbor = txWithPayments.toString();
  logger.info("END close");
  logger.info(`Close ${cbor}`);
  return cbor;
}

const addPayments = async (
  tx: Tx,
  datum: GithoneyDatumT,
  assets: Assets,
  refundings: { [key: string]: Assets },
  lucid: Lucid
): Promise<Tx> => {
  if (datum.contributor) {
    const contributorAddr = await keyPairsToAddress(lucid, datum.contributor);
    tx = tx.payToAddress(contributorAddr, { lovelace: MIN_ADA });
    assets = {
      ...assets,
      lovelace: assets["lovelace"] - MIN_ADA
    };
  }
  const maintainerAddr = await keyPairsToAddress(lucid, datum.maintainer);
  const initialAssets = initialValueToAssets(datum.initial_value);

  tx = tx.payToAddress(maintainerAddr, initialAssets);
  Object.entries(refundings).forEach(([addr, refund]) => {
    tx = tx.payToAddress(addr, refund);
  });

  return tx;
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

const checkRefundingsAreValid = (
  refundings: { [key: string]: Assets },
  initialValue: Assets,
  assetsInUtxo: Assets
): boolean => {
  let totalRefundings = Object.values(refundings).reduce(assetsAdd, {});
  totalRefundings = assetsAdd(totalRefundings, initialValue);
  return Object.entries(totalRefundings).every(([unit, amount]) => {
    return amount <= (assetsInUtxo[unit] || 0n);
  });
};

const initialValueToAssets = (
  initialValue: {
    asset: { policy_id: string; asset_name: string };
    amount: bigint;
  }[]
): Assets => {
  {
    let initialAssets: Assets = {};
    initialValue.forEach(({ asset, amount }) => {
      let unit;
      if (asset.policy_id === "") {
        unit = "lovelace";
      } else {
        unit = toUnit(asset.policy_id, asset.asset_name);
      }
      initialAssets[unit] = amount;
    });
    return initialAssets;
  }
};

export { closeBounty };
