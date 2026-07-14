import { Constr, Data, fromText } from "@spacebudz/lucid";
import {
  CardanoAddressAddress,
  CardanoAddressPaymentCredential,
  GithoneyContractGithoneySpend,
  GithoneyContractSettingsSpend,
  PairsCardanoAssetsPolicyIdPairsCardanoAssetsAssetNameInt,
  TypesGithoneyContractRedeemers,
  TypesGithoneyDatum,
  TypesSettingsDatum,
  TypesSettingsRedeemers
} from "./plutus";

const WalletSchema = Data.Object({
  paymentKey: Data.Bytes(),
  stakeKey: Data.Nullable(Data.Bytes())
});

type Address = CardanoAddressAddress;
type PaymentCredential = CardanoAddressPaymentCredential;

const GithoneyDatumSchema = GithoneyContractGithoneySpend.datum;

type GithoneyDatum = TypesGithoneyDatum;

type InitialValue = PairsCardanoAssetsPolicyIdPairsCardanoAssetsAssetNameInt;

function mkDatum(params: {
  adminPaymentCredential: PaymentCredential;
  maintainerAddress: Address;
  contributorAddress: Address | null;
  bountyRewardFee: bigint;
  deadline: bigint;
  merged: boolean;
  initialValue: InitialValue;
}): string {
  const d: GithoneyDatum = {
    adminPaymentCredential: params.adminPaymentCredential,
    maintainerAddress: params.maintainerAddress,
    contributorAddress: params.contributorAddress,
    bountyRewardFee: params.bountyRewardFee,
    deadline: params.deadline,
    merged: params.merged,
    initialValue: params.initialValue
  };
  const datum = Data.to<GithoneyDatum>(d, GithoneyDatumSchema);
  return datum;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace GithoneyValidatorRedeemer {
  export const AddRewards = () => Data.to("AddRewards", GitHoneyRedeemerSchema);
  export const Assign = () => Data.to("Assign", GitHoneyRedeemerSchema);
  export const Merge = () => Data.to("Merge", GitHoneyRedeemerSchema);
  export const Close = () => Data.to("Close", GitHoneyRedeemerSchema);
  export const Claim = () => Data.to("Claim", GitHoneyRedeemerSchema);
}
const GitHoneyRedeemerSchema = GithoneyContractGithoneySpend.redeemer;
type GithoneyValidatorRedeemer = TypesGithoneyContractRedeemers;

const SettingsDatumSchema = GithoneyContractSettingsSpend.datum;

type SettingsDatum = TypesSettingsDatum;

function mkSettingsDatum(params: {
  githoneyAddress: Address;
  creationFee: bigint;
  rewardFee: bigint;
}): string {
  console.dir(params, { depth: 5 });
  const d: SettingsDatum = {
    githoneyAddress: params.githoneyAddress,
    bountyCreationFee: params.creationFee,
    bountyRewardFee: params.rewardFee
  };
  const datum = Data.to(d, SettingsDatumSchema);
  return datum;
}

const SettingsRedeemerSchema = GithoneyContractSettingsSpend.redeemer;

type SettingsRedeemer = TypesSettingsRedeemers;

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace SettingsRedeemer {
  export const Update = () =>
    Data.to(
      "UpdateSettings",
      SettingsRedeemerSchema as unknown as SettingsRedeemer
    );

  export const Close = () =>
    Data.to(
      "CloseSettings",
      SettingsRedeemerSchema as unknown as SettingsRedeemer
    );
}

const BadgeDatumSchema = Data.Object({
  metadata: Data.Map(Data.Bytes(), Data.Bytes()),
  version: Data.Integer()
});

type BadgeDatumT = typeof BadgeDatumSchema;
const BadgeDatum = BadgeDatumSchema;

interface Metadata {
  name: string;
  logo: string;
  description: string;
}

const mkBadgeDatum = (metadata: Metadata, version: bigint) => {
  const hexMetadata: [string, string][] = Object.entries(metadata).map(
    ([key, value]) => [fromText(key), fromText(value)]
  );
  const mapMetadata = new Map<string, string>(hexMetadata);
  const datum: BadgeDatumT = {
    metadata: mapMetadata,
    version: version
  };
  return Data.to<BadgeDatumT>(datum, BadgeDatum);
};

export {
  mkDatum,
  mkBadgeDatum,
  mkSettingsDatum,
  SettingsDatumSchema,
  SettingsDatum,
  GithoneyDatum,
  GithoneyDatumSchema,
  GithoneyValidatorRedeemer,
  SettingsRedeemer,
  WalletSchema,
  Address,
  Metadata,
  BadgeDatum,
  InitialValue
};
