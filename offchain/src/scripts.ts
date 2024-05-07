import {
  SpendingValidator,
  PaymentKeyHash,
  Data,
  applyParamsToScript,
  ScriptHash,
  OutRef,
  Wallet
} from "lucid-cardano";
import plutusBlueprint from "../../onchain/plutus.json" assert { type: "json" };
import { WalletSchema } from "./types";

const githoneyValidator = plutusBlueprint.validators.find(
  ({ title }) => title === "githoney_contract.githoney_contract"
);

const mintingPolicy = plutusBlueprint.validators.find(
  ({ title }) => title === "githoney_contract.githoney_policy"
);

if (!githoneyValidator) {
  throw new Error(
    "githoney validator indexed with 'main.githoney_validator' in plutus.json failed!"
  );
}

if (!mintingPolicy) {
  throw new Error(
    "Minting validator indexed with 'main.githoney_token_minting_policy' in plutus.json failed!"
  );
}

const GITHONEY_SCRIPT: SpendingValidator["script"] =
  githoneyValidator.compiledCode;
const MINTING_SCRIPT: SpendingValidator["script"] = mintingPolicy.compiledCode;

const ParamsSchema = Data.Tuple([
  Data.Object({
    githoneyWallet: WalletSchema,
    creationFee: Data.Integer(),
    rewardFee: Data.Integer()
  })
]);
type ParamsT = Data.Static<typeof ParamsSchema>;
const Params = ParamsSchema as unknown as ParamsT;

type WalletT = Data.Static<typeof WalletSchema>;

function buildGithoneyValidator(
  githoneyWallet: WalletT,
  creationFee: bigint,
  rewardFee: bigint
): SpendingValidator {
  return {
    type: "PlutusV2",
    script: applyParamsToScript<ParamsT>(
      GITHONEY_SCRIPT,
      [
        {
          githoneyWallet: githoneyWallet,
          creationFee: creationFee,
          rewardFee: rewardFee
        }
      ],
      Params
    )
  };
}

const GITHONEY_SCRIPT_HASH: ScriptHash = githoneyValidator.hash;

function buildGithoneyMintingPolicy(
  githoneyWallet: WalletT,
  creationFee: bigint,
  rewardFee: bigint
): SpendingValidator {
  return {
    type: "PlutusV2",
    script: applyParamsToScript<ParamsT>(
      MINTING_SCRIPT,
      [
        {
          githoneyWallet: githoneyWallet,
          creationFee: creationFee,
          rewardFee: rewardFee
        }
      ],
      Params
    )
  };
}

export {
  buildGithoneyMintingPolicy,
  GITHONEY_SCRIPT_HASH,
  buildGithoneyValidator
};
