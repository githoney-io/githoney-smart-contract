import { Data, Lucid, OutRef, UTxO } from "lucid-cardano";
import {
  SettingsDatum,
  SettingsDatumT,
  SettingsValidatorRedeemer
} from "../../types";
import {
  clearZeroAssets,
  extractBountyIdTokenUnit,
  keyPairsToAddress
} from "../../utils";
import logger from "../../logger";

async function closeSettings(
  settingsUtxo: UTxO,
  utxoRef: OutRef,
  lucid: Lucid
): Promise<string> {
  logger.info("START closeSettings");

  //   const githoneyScript = settingsUtxo.scriptRef;
  //   if (!githoneyScript) {
  //     throw new Error("Githoney validator not found");
  //   }
  const mintingPolicyid = lucid.utils.mintingPolicyToId(githoneyScript);
  const [utxo] = await lucid.utxosByOutRef([utxoRef]);
  const settingsDatum: SettingsDatumT = await lucid.datumOf(
    utxo,
    SettingsDatum
  );

  const githoneyAddr = await keyPairsToAddress(lucid, settingsDatum.githoney);

  lucid.selectWalletFrom({
    address: githoneyAddr
  });

  const githoneyPkh =
    lucid.utils.getAddressDetails(githoneyAddr).paymentCredential?.hash!;

  const bountyIdTokenUnit = extractBountyIdTokenUnit(
    utxo.assets,
    mintingPolicyid
  );
  const githoneyPayment = clearZeroAssets({
    ...utxo.assets,
    [bountyIdTokenUnit]: 0n
  });

  const tx = await lucid
    .newTx()
    .readFrom([settingsUtxo])
    .collectFrom([utxo], SettingsValidatorRedeemer.CloseSettings())
    .payToAddress(githoneyPkh, githoneyPayment)
    .mintAssets({ [bountyIdTokenUnit]: BigInt(-1) }, Data.void())
    .addSignerKey(githoneyPkh)
    .complete();

  const cbor = tx.toString();
  logger.info("END closeSettings");
  logger.info(`CloseSettings ${cbor}`);
  return cbor;
}

export { closeSettings };
