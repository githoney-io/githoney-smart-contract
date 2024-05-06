import {
  SpendingValidator,
  PaymentKeyHash,
  Data,
  applyParamsToScript,
  ScriptHash,
  OutRef
} from "lucid-cardano";
import plutusBlueprint from "../../onchain/plutus.json" assert { type: "json" };

const githoneyValidator = plutusBlueprint.validators.find(
  ({ title }) => title === "githoney_contract.githoney_contract"
);

const mintingPolicy = plutusBlueprint.validators.find(
  ({ title }) => title === "githoney_policy.githoney_policy"
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

function buildGithoneyValidator(): SpendingValidator {
  return {
    type: "PlutusV2",
    script: GITHONEY_SCRIPT
  };
}

const GITHONEY_SCRIPT_HASH: ScriptHash = githoneyValidator.hash;

function buildGithoneyMintingPolicy(outRef: OutRef): SpendingValidator {
  const MintingPolicyParamSchema = Data.Tuple([Data.Bytes(), Data.Integer()]);
  type MintingPolicyParamT = Data.Static<typeof MintingPolicyParamSchema>;
  const MintingPolicyParam =
    MintingPolicyParamSchema as unknown as MintingPolicyParamT;
  return {
    type: "PlutusV2",
    script: applyParamsToScript<MintingPolicyParamT>(
      MINTING_SCRIPT,
      [outRef.txHash, BigInt(outRef.outputIndex)],
      MintingPolicyParam
    )
  };
}

export {
  buildGithoneyMintingPolicy,
  GITHONEY_SCRIPT_HASH,
  buildGithoneyValidator
};
