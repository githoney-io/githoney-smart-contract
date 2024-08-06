import {
  Assets,
  Data,
  fromUnit,
  Lucid,
  OutRef,
  toUnit,
  Tx,
  UTxO
} from "lucid-cardano";
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
    await addPayments(tx, bountyDatum, utxo.assets, lucid)
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
  let initial_assets: Assets = {};
  datum.initial_value.forEach(({ asset, amount }) => {
    let unit;
    if (asset.policy_id === "") {
      unit = "lovelace";
    } else {
      unit = toUnit(asset.policy_id, asset.asset_name);
    }
    initial_assets[unit] = amount;
  });
  tx = tx.payToAddress(maintainerAddr, initial_assets);

  return tx;
};

export { closeBounty };
