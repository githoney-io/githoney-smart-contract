import { OutRef, Addresses, Script } from "@spacebudz/lucid";
import {
  CardanoAddressAddress,
  CardanoAddressPaymentCredential,
  GithoneyContractGithoneySpend,
  GithoneyContractSettingsSpend,
  PairsCardanoAssetsPolicyIdPairsCardanoAssetsAssetNameInt,
  TypesGithoneyContractRedeemers,
  TypesGithoneyDatum,
  TypesSettingsDatum,
  TypesSettingsRedeemers,
  GithoneyContractGithoneyMint,
  GithoneyContractSettingsMintingMint,
} from "./plutus";

const GITHONEY_SCRIPT = GithoneyContractGithoneySpend;
const MINTING_SCRIPT = GithoneyContractGithoneyMint;
const SETTINGS_SCRIPT = new GithoneyContractSettingsSpend();
const SETTINGS_POLICY = GithoneyContractSettingsMintingMint;

type Address = CardanoAddressAddress;
type PaymentCredential = CardanoAddressPaymentCredential;

const GithoneyDatumSchema = GithoneyContractGithoneySpend.datum;

type GithoneyDatum = TypesGithoneyDatum;

type InitialValue = PairsCardanoAssetsPolicyIdPairsCardanoAssetsAssetNameInt;

const GitHoneyRedeemerSchema = GithoneyContractGithoneySpend.redeemer;
type GithoneyValidatorRedeemer = TypesGithoneyContractRedeemers;

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

export {
  githoneyMintingPolicy,
  githoneyValidator,
  settingsPolicy,
  settingsValidator,
  GithoneyDatumSchema,
  GithoneyDatum,
  InitialValue,
  GitHoneyRedeemerSchema,
  GithoneyValidatorRedeemer,
  SettingsDatumSchema,
  SettingsDatum,
  SettingsRedeemerSchema,
  SettingsRedeemer,
  Address,
  PaymentCredential,
};
