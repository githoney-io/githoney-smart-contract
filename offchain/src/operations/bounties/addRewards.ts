import { Lucid, OutRef, UTxO } from "lucid-cardano";
import {
  GithoneyDatum,
  GithoneyDatumT,
  GithoneyValidatorRedeemer
} from "../../types";
import logger from "../../logger";

async function addRewards(
  settingsUtxo: UTxO,
  utxoRef: OutRef,
  address: string,
  reward: { unit: string; amount: bigint },
  lucid: Lucid
): Promise<string> {
  logger.info("START addRewards");

  const githoneyScript = settingsUtxo.scriptRef;
  if (!githoneyScript) {
    throw new Error("Githoney validator not found");
  }
  const validatorAddress = lucid.utils.validatorToAddress(githoneyScript);
  const [utxo] = await lucid.utxosByOutRef([utxoRef]);
  const oldDatum: GithoneyDatumT = await lucid.datumOf(utxo, GithoneyDatum);

  if (oldDatum.merged) {
    throw new Error("Bounty already merged");
  }
  if (oldDatum.deadline < Date.now()) {
    throw new Error("Bounty deadline passed");
  }
  const prevAssets = utxo.assets[reward.unit];
  const newAssets = {
    ...utxo.assets,
    [reward.unit]: prevAssets ? prevAssets + reward.amount : reward.amount
  };

  lucid.selectWalletFrom({ address: address });
  const now = new Date();
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const tx = await lucid
    .newTx()
    .readFrom([settingsUtxo])
    .validTo(sixHoursFromNow.getTime())
    .collectFrom([utxo], GithoneyValidatorRedeemer.AddRewards())
    .payToContract(validatorAddress, { inline: utxo.datum! }, newAssets)
    .complete();

  const cbor = tx.toString();
  logger.info("END addRewards");
  logger.info(`Add Rewards: ${cbor}`);
  return cbor;
}

export { addRewards };
