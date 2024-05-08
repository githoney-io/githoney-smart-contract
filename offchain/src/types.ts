import { Data } from "lucid-cardano";

const WalletSchema = Data.Object({
  paymentKey: Data.Bytes(),
  stakeKey: Data.Nullable(Data.Bytes())
});

type WalletT = Data.Static<typeof WalletSchema>;

const DatumSchema = Data.Object({
  maintainer: WalletSchema,
  admin: WalletSchema,
  githoney: WalletSchema,
  deadline: Data.Integer(),
  bounty_id: Data.Bytes(),
  merged: Data.Boolean(),
  contributor: Data.Nullable(WalletSchema)
});

type GithoneyDatumT = Data.Static<typeof DatumSchema>;
const GithoneyDatum = DatumSchema as unknown as GithoneyDatumT;

function mkDatum(
  admin: WalletT,
  maintainer: WalletT,
  githoney: WalletT,
  deadline: bigint,
  bounty_id: string,
  merged: boolean
): string {
  const d: GithoneyDatumT = {
    admin,
    maintainer,
    githoney,
    deadline,
    bounty_id,
    merged,
    contributor: null
  };
  const datum = Data.to<GithoneyDatumT>(d, GithoneyDatum);
  return datum;
}

const GithoneyValidatorRedeemerSchema = Data.Enum([
  Data.Literal("Deposit"),
  Data.Literal("Merge"),
  Data.Literal("Close"),
  Data.Literal("Claim")
]);

type GithoneyValidatorRedeemerT = Data.Static<
  typeof GithoneyValidatorRedeemerSchema
>;

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace GithoneyValidatorRedeemer {
  export const Deposit = () =>
    Data.to(
      "Deposit",
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
  GithoneyDatumT,
  GithoneyValidatorRedeemer,
  WalletSchema,
  WalletT
};
