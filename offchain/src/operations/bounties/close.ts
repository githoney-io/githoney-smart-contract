import {
  Addresses,
  Assets,
  Data,
  Lucid,
  OutRef,
  toUnit,
  Tx,
  Utxo
} from "@spacebudz/lucid";
import {
  GithoneyDatum,
  GithoneyDatumSchema,
  GithoneyValidatorRedeemer,
  InitialValue
} from "../../types";
import {
  clearZeroAssets,
  extractBountyIdTokenUnit,
  keyPairsToAddress
} from "../../utils";
import { MIN_ADA } from "../../constants";
import logger from "../../logger";

/**
 * Builds a `closeBounty` transaction. The tx is built in the context of the admin wallet.
 * @param settingsUtxo The settings Utxo.
 * @param lucid Lucid instance.
 * @param utxoRef The reference of the last transaction output that contains the bounty Utxo.
 * @param refundings The refundings needed for after creation sponsors.
 * @returns The cbor of the unsigned transaction.
 */

async function closeBounty(
  adminAddress: string,
  settingsUtxo: Utxo,
  utxoRef: OutRef,
  refundings: { [key: string]: Assets },
  lucid: Lucid
): Promise<string> {
  logger.info("START close");

  const githoneyScript = settingsUtxo.scriptRef;
  if (!githoneyScript) {
    throw new Error("Githoney validator not found");
  }
  const mintingPolicyid = Addresses.scriptToCredential(githoneyScript);
  const [utxo] = await lucid.utxosByOutRef([utxoRef]);
  const bountyDatum: GithoneyDatum = await lucid.datumOf(
    utxo,
    GithoneyDatumSchema
  );

  if (bountyDatum.merged) {
    throw new Error("Bounty already merged");
  }
  if (
    !checkRefundingsAreValid(
      refundings,
      initialValueToAssets(bountyDatum.initialValue),
      utxo.assets
    )
  ) {
    throw new Error("Refundings are invalid");
  }

  const bountyIdTokenUnit = extractBountyIdTokenUnit(
    utxo.assets,
    mintingPolicyid.hash
  );

  lucid.selectReadOnlyWallet({ address: adminAddress });
  const adminPkh = Addresses.inspect(adminAddress).payment?.hash!;
  const now = new Date();
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const tx = lucid
    .newTx()
    .readFrom([settingsUtxo])
    .validTo(sixHoursFromNow.getTime())
    .collectFrom([utxo], GithoneyValidatorRedeemer.Close())
    .mint({ [bountyIdTokenUnit]: BigInt(-1) }, Data.void())
    .addSigner(adminPkh);

  const txWithPayments = await (
    await addPayments(tx, bountyDatum, utxo.assets, refundings, lucid)
  ).commit();

  const cbor = txWithPayments.toString();
  logger.info("END close");
  logger.info(`Close ${cbor}`);
  return cbor;
}

const addPayments = async (
  tx: Tx,
  datum: GithoneyDatum,
  assets: Assets,
  refundings: { [key: string]: Assets },
  lucid: Lucid
): Promise<Tx> => {
  const maintainerAddr = await keyPairsToAddress(
    lucid.network,
    datum.maintainerAddress
  );
  const initialAssets = initialValueToAssets(datum.initialValue);
  tx = tx.payTo(maintainerAddr, initialAssets);

  if (datum.contributorAddress) {
    const contributorAddr = await keyPairsToAddress(
      lucid.network,
      datum.contributorAddress
    );
    tx = tx.payTo(contributorAddr, { lovelace: MIN_ADA });
    assets = {
      ...assets,
      lovelace: assets["lovelace"] - MIN_ADA
    };
  }
  Object.entries(refundings).forEach(([addr, refund]) => {
    tx = tx.payTo(addr, refund);
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

const initialValueToAssets = (initialValue: InitialValue): Assets => {
  {
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
  }
};

export { closeBounty, initialValueToAssets };
