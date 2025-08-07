import { protocol } from "../../gen/typescript/protocol.ts";
import {
  Data,
  fromText,
  OutRef,
  toUnit,
  Assets,
  Utxo,
  Lucid,
  Constr,
  fromUnit,
  toText,
  Addresses,
} from "@spacebudz/lucid";
import {
  cardanoCredentialToCredential,
  getScriptVersion,
  keyPairsToAddress,
  logger,
  lucidBase as lucid,
  lucidWithWallet,
} from "../../utils/utils.ts";
import {
  SettingsDatumSchema,
  badgesPolicy,
  badgesValidator,
  settingsPolicy,
} from "../../types.ts";
import { collateralOutRef } from "../../utils/utxo.ts";

interface Metadata {
  name: string;
  logo: string;
  description: string;
}

export interface MetadataWithPolicy {
  metadata: Metadata;
  policyId?: string;
}

/**
 * Builds a `deployBadges` transaction. The tx is built in the context of the GitHoney address,
 * checks if the badge is already minted, and deploys the badge if it is not.
 * In the case of updating the metadata, the badge utxo is consumed and the NFT reutilized.
 * @param settingsUtxo The settings Utxo.
 * @param settingsNftOutRef The output reference passed as a parameter of the settings nft minting policy,
 * @param ftBadgeAmount The amount of FT tokens to be minted for each badge.
 * @param ftAddress The address where the FT tokens should be paid.
 * @param metadatas The metadata of the badges to be deployed.
 * @returns The cbor of the unsigned transaction.
 */

async function deployBadges(
  settingsUtxo: Utxo,
  settingsNftOutRef: OutRef,
  ftBadgeAmount: bigint,
  ftAddress: string,
  metadatas: MetadataWithPolicy[],
): Promise<{ cbor: string; newMetadatas: MetadataWithPolicy[] }> {
  logger.info("START deployBadges");
  const settings = await lucid.datumOf(settingsUtxo, SettingsDatumSchema);
  const settingsRef =
    settingsNftOutRef.txHash + "#" + settingsNftOutRef.outputIndex;

  const githoneyAddr = keyPairsToAddress(
    lucid.network,
    settings.githoneyAddress,
  );
  logger.info(`Deploying badges from ${githoneyAddr}`);
  const utxo = (await lucid.utxosAt(githoneyAddr))[0];
  const outRef = {
    txHash: utxo.txHash,
    outputIndex: utxo.outputIndex,
  };

  const [selectedUtxos] = await collateralOutRef(lucidWithWallet);
  const collateralref = selectedUtxos.txHash + "#" + selectedUtxos.outputIndex;

  const settingsMintingPolicy = settingsPolicy(settingsNftOutRef);
  const settingsNftPolicy = Addresses.scriptToCredential(settingsMintingPolicy);
  const badgesScript = badgesValidator(settingsNftPolicy.hash);
  const scriptAddr = Addresses.scriptToAddress(lucid.network, badgesScript);
  const utxosAtScript = await lucid.utxosAt(scriptAddr);

  lucid.selectReadOnlyWallet({ address: githoneyAddr });

  let i = 0n;
  const ftAssets: Assets = {};
  const utxosToCollect: Utxo[] = [];
  const newMetadatas: MetadataWithPolicy[] = [];
  for (const meta of metadatas) {
    logger.info("-------------------------------------------------");
    logger.info(`Deploying badge ${JSON.stringify(meta)}`);
    const { res, referenceNftPolicyId } = await isReferenceNftMinted(
      lucid,
      utxosAtScript,
      meta,
    );
    if (res) {
      logger.info(`Badge already minted ${meta.metadata.name}`);
      newMetadatas.push({
        metadata: meta.metadata,
        policyId: referenceNftPolicyId,
      });
      continue;
    } else {
      logger.error(`Badge not minted ${JSON.stringify(meta)}`);
    }
    let utxos: Utxo[] = [];
    if (meta.policyId) {
      logger.info(
        `Updating metadata of badge ${meta.metadata.name} policy ${meta.policyId}`,
      );
      // We only need to update the metadata
      const nftUnit = toUnit(meta.policyId, fromText(meta.metadata.name), 100);
      utxos = await lucid.utxosAtWithUnit(scriptAddr, nftUnit);
      if (utxos.length === 1) {
        utxosToCollect.push(utxos[0]);
        logger.info("Collecting utxo to update metadata");
        const githoneyPaymentHash = cardanoCredentialToCredential(
          settings.githoneyAddress.paymentCredential,
        ).hash;
        const utxoToCollectRef = utxos[0].txHash + "#" + utxos[0].outputIndex;
        const { tx } = await protocol.updateBadgeTx({
          badgesscript: {
            type: "String",
            value: badgesScript.script,
          },
          badgesscriptversion: {
            type: "Int",
            value: getScriptVersion(badgesScript.type),
          },
          collateralref: {
            type: "String",
            value: collateralref,
          },
          githoneyaddr: {
            type: "String",
            value: githoneyPaymentHash,
          },
          mkey: {
            type: "Int",
            value: 0n,
          },
          mvalue: {
            type: "Int",
            value: 0n,
          },
          script: {
            type: "String",
            value: scriptAddr,
          },
          settingsref: {
            type: "String",
            value: settingsRef,
          },
          utxoref: {
            type: "String",
            value: outRef.txHash + "#" + outRef.outputIndex,
          },
          utxotocollect: {
            type: "String",
            value: utxoToCollectRef,
          },
        });
      }
    }
    if ((meta.policyId && utxos.length === 0) || !meta.policyId) {
      const policyScript = badgesPolicy(outRef, i);
      i++;

      const mintingPolicyid = Addresses.scriptToCredential(policyScript).hash;
      const referenceNFTUnit = toUnit(
        mintingPolicyid,
        fromText(meta.metadata.name),
        100,
      );
      const ftUnit = toUnit(mintingPolicyid, fromText(meta.metadata.name), 333);
      ftAssets[ftUnit] = ftBadgeAmount;

      const hexMetadata: [string, string][] = Object.entries(meta.metadata).map(
        ([key, value]) => [fromText(key), fromText(value)],
      );
      const mapMetadata = new Map<string, string>(hexMetadata);
      //   const datum = mkBadgeDatum(meta.metadata, 1n);
      //   tx.payToWithData(
      //     scriptAddr,
      //     { Inline: datum },
      //     { [referenceNFTUnit]: 1n },
      //   )
      // .payTo(ftAddress, { [ftUnit]: ftBadgeAmount })
      // .attachScript(policyScript)
      // .mint({ [referenceNFTUnit]: 1n, [ftUnit]: ftBadgeAmount }, Data.void());
      newMetadatas.push({ metadata: meta.metadata, policyId: mintingPolicyid });
    }
  }

  const txComplete = await tx.commit();
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
  utxos: Utxo[],
  meta: MetadataWithPolicy,
): Promise<{ res: boolean; referenceNftPolicyId: string | undefined }> {
  for (const utxo of utxos) {
    let referenceNftPolicyId: string | undefined;
    if (utxo.datum) {
      try {
        referenceNftPolicyId = await hasReferenceNft(
          utxo.assets,
          meta.metadata.name,
          meta.policyId,
        );
        const datum = (await lucid.datumOf(utxo)) as Constr<Data>;
        const datumJson = Data.toMetadata(datum.fields[0]);
        if (
          referenceNftPolicyId &&
          datumJson.name === meta.metadata.name &&
          datumJson.logo === meta.metadata.logo &&
          datumJson.description === meta.metadata.description
        ) {
          return { res: true, referenceNftPolicyId };
        }
      } catch (e) {
        const error = e as Error;
        logger.error(error.message);
        continue;
      }
    }
  }
  return { res: false, referenceNftPolicyId: undefined };
}

async function hasReferenceNft(
  assets: Assets,
  name: string,
  policyId?: string,
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
