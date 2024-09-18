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
  fromLabel,
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
  const tx = await lucid
    .newTx()
    .collectFrom([utxo])
    .attachMetadata(674, "Creating badges");

  let i = 0n;
  const ftAssets: Assets = {};
  const policiesToCollect: MetadataWithPolicy[] = [];
  const newMetadatas: MetadataWithPolicy[] = [];
  for (const meta of metadatas) {
    const { res, referenceNftPolicyId } = await isReferenceNftMinted(
      lucid,
      utxosAtScript,
      meta.metadata
    );
    if (res) {
      logger.info("Badge already minted", meta.metadata);
      newMetadatas.push({
        metadata: meta.metadata,
        policyId: referenceNftPolicyId
      });
      continue;
    }
    if (meta.policyId) {
      // metadata not minted but policy already exists
      policiesToCollect.push(meta);
    }
    const policyScript = badgesPolicy(outRef, i);

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
  if (policiesToCollect.length > 0) {
    tx.readFrom([settingsUtxo]);
    tx.attachSpendingValidator(badgesScript);
  }
  for (const meta of policiesToCollect) {
    const utxos = await lucid.utxosAtWithUnit(
      githoneyAddr,
      toUnit(meta.policyId!, fromText(meta.metadata.name), 100)
    );
    if (utxos.length === 1) {
      const utxo = utxos[0];
      tx.collectFrom([utxo], Data.void());
    }
  }

  const txComplete = await tx.payToAddress(githoneyAddr, ftAssets).complete();
  let cbor: string = "";
  if (Object.keys(ftAssets).length === 0) {
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
  metadata: Metadata
): Promise<{ res: boolean; referenceNftPolicyId: string | undefined }> {
  for (const utxo of utxos) {
    let referenceNftPolicyId: string | undefined;
    if (utxo.datum) {
      try {
        referenceNftPolicyId = await hasReferenceNft(
          utxo.assets,
          metadata.name
        );
        const datum = (await lucid.datumOf(utxo)) as Constr<Data>;
        const datumJson = Data.toJson(datum.fields[0]);
        if (
          referenceNftPolicyId &&
          datumJson.name === metadata.name &&
          datumJson.logo === metadata.logo &&
          datumJson.description === metadata.description
        ) {
          logger.info("Badge already minted");
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
  name: string
): Promise<string | undefined> {
  for (const [unit, amount] of Object.entries(assets)) {
    const asset = fromUnit(unit);
    logger.info(asset);
    if (asset.name) {
      if (toText(asset.name) === name && asset.label === 100 && amount === 1n) {
        return asset.policyId;
      }
    }
  }
  return undefined;
}

export { deployBadges };
