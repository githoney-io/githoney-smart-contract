import {
  Data,
  fromText,
  OutRef,
  toUnit,
  Assets,
  UTxO,
  Lucid,
  Constr,
  fromUnit,
  toText,
  PolicyId
} from "lucid-txpipe";
import { Metadata, mkBadgeDatum, SettingsDatum } from "../../types";
import logger from "../../logger";
import { keyPairsToAddress } from "../../utils";
import { badgesPolicy, badgesValidator, settingsPolicy } from "../../scripts";

export interface MetadataWithPolicy {
  metadata: Metadata;
  policyId?: string;
}

async function deployBadges(
  settingsUtxo: UTxO,
  settingsNftOutRef: OutRef,
  ftBadgeAmount: bigint,
  metadatas: MetadataWithPolicy[],
  lucid: Lucid
): Promise<{ cbor: string; newMetadatas: MetadataWithPolicy[] }> {
  logger.info("START deployBadges");
  const settings = await lucid.datumOf(settingsUtxo, SettingsDatum);
  const githoneyAddr = await keyPairsToAddress(lucid, settings.githoney_wallet);
  logger.info(`Deploying badges from ${githoneyAddr}`);
  const utxo = (await lucid.utxosAt(githoneyAddr))[0];
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
  const utxosAtScript = await lucid.utxosAt(scriptAddr);

  lucid.selectWalletFrom({ address: githoneyAddr });
  const tx = lucid
    .newTx()
    .collectFrom([utxo])
    .attachMetadata(674, "Creating badges");

  let i = 0n;
  const ftAssets: Assets = {};
  const utxosToCollect: UTxO[] = [];
  const newMetadatas: MetadataWithPolicy[] = [];
  for (const meta of metadatas) {
    logger.info("-------------------------------------------------");
    logger.info(`Deploying badge ${JSON.stringify(meta)}`);
    const { res, referenceNftPolicyId } = await isReferenceNftMinted(
      lucid,
      utxosAtScript,
      meta
    );
    if (res) {
      logger.info(`Badge already minted ${meta.metadata.name}`);
      newMetadatas.push({
        metadata: meta.metadata,
        policyId: referenceNftPolicyId
      });
      continue;
    } else {
      logger.error(`Badge not minted ${JSON.stringify(meta)}`);
    }
    let utxos: UTxO[] = [];
    if (meta.policyId) {
      logger.info(
        `Updating metadata of badge ${meta.metadata.name} policy ${meta.policyId}`
      );
      // We only need to update the metadata
      const nftUnit = toUnit(meta.policyId!, fromText(meta.metadata.name), 100);
      utxos = await lucid.utxosAtWithUnit(scriptAddr, nftUnit);
      if (utxos.length === 1) {
        utxosToCollect.push(utxos[0]);
        logger.info("Collecting utxo to update metadata");
        tx.payToAddressWithData(
          scriptAddr,
          { inline: mkBadgeDatum(meta.metadata, 1n) },
          { [nftUnit]: 1n }
        );
      }
    }
    if ((meta.policyId && utxos.length === 0) || !meta.policyId) {
      const policyScript = badgesPolicy(outRef, i);
      i++;

      const mintingPolicyid = lucid.utils.mintingPolicyToId(policyScript);
      const referenceNFTUnit = toUnit(
        mintingPolicyid,
        fromText(meta.metadata.name),
        100
      );
      const ftUnit = toUnit(mintingPolicyid, fromText(meta.metadata.name), 333);
      ftAssets[ftUnit] = ftBadgeAmount;

      const datum = mkBadgeDatum(meta.metadata, 1n);
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
      newMetadatas.push({ metadata: meta.metadata, policyId: mintingPolicyid });
    }
  }
  if (utxosToCollect.length > 0) {
    logger.info("Collecting utxos from script");
    tx.readFrom([settingsUtxo])
      .attachSpendingValidator(badgesScript)
      .collectFrom(utxosToCollect, Data.void())
      .addSignerKey(settings.githoney_wallet.paymentKey);
  }

  const txComplete = await tx.payToAddress(githoneyAddr, ftAssets).complete();
  let cbor: string = "";
  if (Object.keys(ftAssets).length === 0 && utxosToCollect.length === 0) {
    logger.info("All badges already minted");
  } else {
    cbor = txComplete.toString();
    logger.info("CBOR");
    logger.info(cbor);
  }
  logger.info("END deployBadges");
  return { cbor, newMetadatas };
}

async function isReferenceNftMinted(
  lucid: Lucid,
  utxos: UTxO[],
  meta: MetadataWithPolicy
): Promise<{ res: boolean; referenceNftPolicyId: string | undefined }> {
  for (const utxo of utxos) {
    let referenceNftPolicyId: string | undefined;
    if (utxo.datum) {
      try {
        referenceNftPolicyId = await hasReferenceNft(
          utxo.assets,
          meta.metadata.name,
          meta.policyId
        );
        const datum = (await lucid.datumOf(utxo)) as Constr<Data>;
        const datumJson = Data.toJson(datum.fields[0]);
        if (
          referenceNftPolicyId &&
          datumJson.name === meta.metadata.name &&
          datumJson.logo === meta.metadata.logo &&
          datumJson.description === meta.metadata.description
        ) {
          return { res: true, referenceNftPolicyId };
        }
      } catch (error) {
        logger.error(error);
        continue;
      }
    }
  }
  return { res: false, referenceNftPolicyId: undefined };
}

async function hasReferenceNft(
  assets: Assets,
  name: string,
  policyId?: PolicyId
): Promise<string | undefined> {
  for (const [unit, amount] of Object.entries(assets)) {
    const asset = fromUnit(unit);
    if (asset.name) {
      if (toText(asset.name) === name && asset.label === 100 && amount === 1n) {
        if (policyId && asset.policyId !== policyId) {
          return undefined;
        } else {
          return asset.policyId;
        }
      }
    }
  }
  return undefined;
}

export { deployBadges, isReferenceNftMinted };
