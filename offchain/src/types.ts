import { Data } from "lucid-cardano";

const CapsuleValidatorRedeemerSchema = Data.Enum([
  Data.Literal("Deposit"),
  Data.Literal("Merge"),
  Data.Literal("Close")
]);

type CapsuleValidatorRedeemerT = Data.Static<
  typeof CapsuleValidatorRedeemerSchema
>;

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace CapsuleValidatorRedeemer {
  export const Deposit = () =>
    Data.to(
      "Deposit",
      CapsuleValidatorRedeemerSchema as unknown as CapsuleValidatorRedeemerT
    );

  export const Merge = () =>
    Data.to(
      "Merge",
      CapsuleValidatorRedeemerSchema as unknown as CapsuleValidatorRedeemerT
    );

  export const Close = () =>
    Data.to(
      "Close",
      CapsuleValidatorRedeemerSchema as unknown as CapsuleValidatorRedeemerT
    );
}

export { CapsuleValidatorRedeemer };
