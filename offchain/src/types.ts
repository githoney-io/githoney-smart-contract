import { Constr, Data } from "lucid-cardano";

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

const multiValWrapper = (
  val_index: number,
  redeemer_index: number,
  params: Data[]
) => Data.to(new Constr(val_index, [new Constr(redeemer_index, params)]));

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace GithoneyValidatorRedeemer {
  export const AddRewards = () => multiValWrapper(1, 0, []);
  export const Assign = () => multiValWrapper(1, 1, []);
  export const Merge = () => multiValWrapper(1, 2, []);
  export const Close = () => multiValWrapper(1, 3, []);
  export const Claim = () => multiValWrapper(1, 4, []);
}

export {
  mkDatum,
  GithoneyDatum,
  GithoneyDatumT,
  GithoneyValidatorRedeemer,
  WalletSchema,
  WalletT
};
