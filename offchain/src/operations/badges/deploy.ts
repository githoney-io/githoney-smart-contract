import {
  applyParamsToScript,
  Data,
  fromText,
  OutRef,
  SpendingValidator,
  toUnit,
  Script,
  C,
  Assets,
  UTxO,
  Tx,
  Lucid,
  TxComplete
} from "lucid-txpipe";
import { BadgeDatum, Metadata, mkBadgeDatum, SettingsDatum } from "../../types";
import logger from "../../logger";
import { keyPairsToAddress } from "../../utils";
import { badgesPolicy, badgesValidator, settingsPolicy } from "../../scripts";

async function deployBadges(
  settingsUtxo: UTxO,
  settingsNftOutRef: OutRef,
  ftBadgeAmount: bigint,
  metadatas: Metadata[],
  lucid: Lucid
): Promise<TxComplete> {
  logger.info("START deployBadges");
  const settings = await lucid.datumOf(settingsUtxo, SettingsDatum);
  const githoneyAddr = await keyPairsToAddress(lucid, settings.githoney_wallet);
  const utxos = await lucid.utxosAt(githoneyAddr);
  const utxo = utxos[0];
  const outRef = {
    txHash: utxo.txHash,
    outputIndex: utxo.outputIndex
  };
  const settingsMintingPolicy = settingsPolicy(settingsNftOutRef);
  const settingsNftPolicy = await lucid.utils.mintingPolicyToId(
    settingsMintingPolicy
  );
  const badgesScript = badgesValidator(settingsNftPolicy);
  const scriptAddr = await lucid.utils.validatorToAddress(badgesScript);

  lucid.selectWalletFrom({ address: githoneyAddr });
  const tx = await lucid
    .newTx()
    .collectFrom([utxo])
    .attachMetadata(674, "Creating badges");

  let i = 0n;
  const ftAssets: Assets = {};
  metadatas.forEach((metadata) => {
    if (isReferenceNftMinted(utxos, metadata)) {
      logger.info("Badge already minted", metadata);
      return;
    }
    console.log(metadata);
    const policyScript = badgesPolicy(outRef, i);

    const mintingPolicyid = lucid.utils.mintingPolicyToId(policyScript);
    const referenceNFTUnit = toUnit(
      mintingPolicyid,
      fromText(metadata.name),
      100
    );
    const ftUnit = toUnit(mintingPolicyid, fromText(metadata.name), 333);
    ftAssets[ftUnit] = ftBadgeAmount;

    const datum = mkBadgeDatum(metadata, 1n);
    tx.payToAddressWithData(
      scriptAddr,
      { inline: datum },
      { [referenceNFTUnit]: 1n }
    )
      .attachMintingPolicy(policyScript)
      .mintAssets(
        { [referenceNFTUnit]: 1n, [ftUnit]: ftBadgeAmount },
        Data.void()
      );
  });

  const txComplete = await tx.payToAddress(githoneyAddr, ftAssets).complete();
  logger.info("CBOR", txComplete.toString());
  logger.info("END deployBadges");
  return txComplete;
}

function isReferenceNftMinted(utxos: UTxO[], metadata: Metadata): boolean {
  for (const utxo of utxos) {
    if (utxo.datum) {
      try {
        const datum = Data.from(utxo.datum, BadgeDatum);
        if (
          datum.metadata.get("name") === fromText(metadata.name) &&
          datum.metadata.get("logo") === fromText(metadata.logo) &&
          datum.metadata.get("description") === fromText(metadata.description)
        ) {
          return true;
        }
      } catch (error) {
        continue;
      }
    }
  }
  return false;
}

export { deployBadges };
