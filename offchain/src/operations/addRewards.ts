import { buildGithoneyValidator } from "../scripts";
import { Constr, Data, Lucid, OutRef } from "lucid-cardano";
import { GithoneyDatumT, GithoneyValidatorRedeemer } from "../types";
import { validatorParams } from "../utils";

async function addRewards(
  utxoRef: OutRef,
  address: string,
  reward: { unit: string; amount: bigint },
  lucid: Lucid
): Promise<string> {
  console.debug("START addRewards");
  const scriptParams = validatorParams(lucid);

  const gitHoneyValidator = buildGithoneyValidator(scriptParams);
  const validatorAddress = lucid.utils.validatorToAddress(gitHoneyValidator);
  const [utxo] = await lucid.utxosByOutRef([utxoRef]);
  const oldDatum: GithoneyDatumT = await lucid.datumOf(utxo);

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
    .validTo(sixHoursFromNow.getTime())
    .collectFrom([utxo], GithoneyValidatorRedeemer.AddRewards())
    .payToContract(validatorAddress, { inline: utxo.datum! }, newAssets)
    .attachSpendingValidator(gitHoneyValidator)
    .complete();

  const cbor = tx.toString();
  console.debug("END addRewards");
  console.debug(`Add Rewards: ${cbor}`);
  return cbor;
}

export { addRewards };
