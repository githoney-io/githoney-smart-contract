import { Data, Lucid, OutRef, UTxO } from "lucid-cardano";
import { SettingsRedeemer } from "../../types";
import { addrToWallet, clearZeroAssets } from "../../utils";
import { githoneyAddr } from "../../constants";
import logger from "../../logger";
import { settingsPolicy, settingsValidator } from "../../scripts";

async function closeSettings(
  utxoRef: OutRef,
  settingsUtxo: UTxO,
  lucid: Lucid
): Promise<string> {
  logger.info("START closeSettings");

  const settingsValidatorScript = settingsValidator();

  const [utxo] = await lucid.utxosByOutRef([utxoRef]);
  const settingsMintingPolicy = settingsPolicy({
    txHash: utxo.txHash,
    outputIndex: utxo.outputIndex
  });

  const settingsTokenUnit = Object.keys(settingsUtxo.assets).find((unit) => {
    return unit !== "lovelace";
  })!;
  const githoneyPkh = addrToWallet(githoneyAddr, lucid).paymentKey;

  lucid.selectWalletFrom({
    address: githoneyAddr
  });

  const githoneyPayment = clearZeroAssets({
    ...settingsUtxo.assets,
    [settingsTokenUnit]: 0n
  });

  const tx = await lucid
    .newTx()
    .collectFrom([settingsUtxo], SettingsRedeemer.Close())
    .payToAddress(githoneyAddr, githoneyPayment)
    .mintAssets({ [settingsTokenUnit]: BigInt(-1) }, Data.void())
    .addSignerKey(githoneyPkh)
    .attachSpendingValidator(settingsValidatorScript)
    .attachMintingPolicy(settingsMintingPolicy)
    .complete();

  const cbor = tx.toString();
  logger.info("END closeSettings");
  logger.info(`CloseSettings ${cbor}`);
  return cbor;
}

export { closeSettings };
