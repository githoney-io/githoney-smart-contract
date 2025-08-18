import { OutRef, Addresses, Script } from "@spacebudz/lucid";
import {
  CardanoAddressAddress,
  CardanoAddressPaymentCredential,
  CardanoAddressStakeCredential,
  GithoneyContractGithoneySpend,
  GithoneyContractSettingsSpend,
  PairsCardanoAssetsPolicyIdPairsCardanoAssetsAssetNameInt,
  TypesGithoneyDatum,
  TypesSettingsDatum,
  TypesSettingsRedeemers,
  GithoneyContractGithoneyMint,
  GithoneyContractSettingsMintingMint,
  GithoneyContractBadgesPolicyMint,
  GithoneyContractBadgesContractSpend,
} from "./plutus.ts";

const GITHONEY_SCRIPT = GithoneyContractGithoneySpend;
const MINTING_SCRIPT = GithoneyContractGithoneyMint;
const SETTINGS_SCRIPT = new GithoneyContractSettingsSpend();
const SETTINGS_POLICY = GithoneyContractSettingsMintingMint;
const BADGES_POLICY = GithoneyContractBadgesPolicyMint;
const BADGES_SCRIPT = GithoneyContractBadgesContractSpend;

type Address = CardanoAddressAddress;
type PaymentCredential = CardanoAddressPaymentCredential;
type StakeCredential = CardanoAddressStakeCredential;

const GithoneyDatumSchema = GithoneyContractGithoneySpend.datum;

type GithoneyDatum = TypesGithoneyDatum;

type InitialValue = PairsCardanoAssetsPolicyIdPairsCardanoAssetsAssetNameInt;

const SettingsDatumSchema = GithoneyContractSettingsSpend.datum;

type SettingsDatum = TypesSettingsDatum;

const SettingsRedeemerSchema = GithoneyContractSettingsSpend.redeemer;
type SettingsRedeemer = TypesSettingsRedeemers;

function githoneyValidator(settingsPolicyId: string): Script {
  return new GITHONEY_SCRIPT(settingsPolicyId);
}

function githoneyMintingPolicy(settingsPolicyId: string): Script {
  return new MINTING_SCRIPT(settingsPolicyId);
}

function settingsPolicy(outRef: OutRef): Script {
  // Convert OutRef to CardanoTransactionOutputReference
  const outRefParam = {
    transactionId: outRef.txHash,
    outputIndex: BigInt(outRef.outputIndex),
  };
  // Get the script address for the settings validator
  const settingsValidatorScript = SETTINGS_SCRIPT;
  const settingsValidatorCredential = Addresses.scriptToCredential(
    settingsValidatorScript,
  );
  if (!settingsValidatorCredential) {
    throw new Error(
      "Settings validator address does not have a payment credential",
    );
  }
  return new SETTINGS_POLICY(outRefParam, {
    paymentCredential: { Script: [settingsValidatorCredential.hash] },
    stakeCredential: null,
  });
}

function settingsValidator(): Script {
  return SETTINGS_SCRIPT;
}

function badgesPolicy(outRef: OutRef, nonce: bigint): Script {
  // Convert OutRef to CardanoTransactionOutputReference
  const outRefParam = {
    transactionId: outRef.txHash,
    outputIndex: BigInt(outRef.outputIndex),
  };
  return new BADGES_POLICY(outRefParam, nonce);
}

function badgesValidator(settingsPolicyId: string): Script {
  return new BADGES_SCRIPT(settingsPolicyId);
}

interface Metadata {
  name: string;
  logo: string;
  description: string;
}
interface MetadataWithPolicy {
  metadata: Metadata;
  policyId?: string;
}

export {
  githoneyMintingPolicy,
  githoneyValidator,
  settingsPolicy,
  settingsValidator,
  badgesPolicy,
  badgesValidator,
  GithoneyDatumSchema,
  SettingsDatumSchema,
  SettingsRedeemerSchema,
};
export type {
  GithoneyDatum,
  InitialValue,
  SettingsDatum,
  SettingsRedeemer,
  Address,
  PaymentCredential,
  StakeCredential,
  Metadata,
  MetadataWithPolicy,
};
