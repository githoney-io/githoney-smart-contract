import { Data } from "lucid-cardano";

const WalletSchema = Data.Object({
  paymentKey: Data.Bytes(),
  stakeKey: Data.Nullable(Data.Bytes())
});

type WalletT = Data.Static<typeof WalletSchema>;

const DatumSchema = Data.Object({
  admin: WalletSchema,
  maintainer: WalletSchema,
  contributor: Data.Nullable(WalletSchema),
  bounty_id: Data.Bytes(),
  deadline: Data.Integer(),
  merged: Data.Boolean()
});

type GithoneyDatumT = Data.Static<typeof DatumSchema>;
const GithoneyDatum = DatumSchema as unknown as GithoneyDatumT;

function mkDatum(params: {
  admin: WalletT;
  maintainer: WalletT;
  contributor: WalletT | null;
  bounty_id: string;
  deadline: bigint;
  merged: boolean;
}): string {
  const d: GithoneyDatumT = {
    admin: params.admin,
    maintainer: params.maintainer,
    contributor: params.contributor,
    bounty_id: params.bounty_id,
    deadline: params.deadline,
    merged: params.merged
  };
  const datum = Data.to<GithoneyDatumT>(d, GithoneyDatum);
  return datum;
}

const GithoneyValidatorRedeemerSchema = Data.Enum([
  Data.Literal("AddRewards"),
  Data.Literal("Assign"),
  Data.Literal("Merge"),
  Data.Literal("Close"),
  Data.Literal("Claim")
]);

type GithoneyValidatorRedeemerT = Data.Static<
  typeof GithoneyValidatorRedeemerSchema
>;

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace GithoneyValidatorRedeemer {
  export const AddRewards = () =>
    Data.to(
      "AddRewards",
      GithoneyValidatorRedeemerSchema as unknown as GithoneyValidatorRedeemerT
    );

  export const Assign = () =>
    Data.to(
      "Assign",
      GithoneyValidatorRedeemerSchema as unknown as GithoneyValidatorRedeemerT
    );

  export const Merge = () =>
    Data.to(
      "Merge",
      GithoneyValidatorRedeemerSchema as unknown as GithoneyValidatorRedeemerT
    );

  export const Close = () =>
    Data.to(
      "Close",
      GithoneyValidatorRedeemerSchema as unknown as GithoneyValidatorRedeemerT
    );

  export const Claim = () =>
    Data.to(
      "Claim",
      GithoneyValidatorRedeemerSchema as unknown as GithoneyValidatorRedeemerT
    );
}

export {
  mkDatum,
  GithoneyDatum,
  GithoneyDatumT,
  GithoneyValidatorRedeemer,
  WalletSchema,
  WalletT
};
