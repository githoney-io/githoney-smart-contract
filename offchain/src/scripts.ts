import {
  SpendingValidator,
  Data,
  applyParamsToScript,
  ScriptHash,
  OutRef,
  PolicyId
} from "lucid-txpipe";
import plutusBlueprint from "../../onchain/plutus.json" assert { type: "json" };

const GITHONEY_VALIDATOR = plutusBlueprint.validators.find(
  ({ title }) => title === "githoney_contract.githoney_contract"
);

const GITHONEY_MINTING = plutusBlueprint.validators.find(
  ({ title }) => title === "githoney_contract.githoney_policy"
);

const SETTINGS_VALIDATOR = plutusBlueprint.validators.find(
  ({ title }) => title === "githoney_contract.settings_contract"
);

const SETTINGS_MINTING = plutusBlueprint.validators.find(
  ({ title }) => title === "githoney_contract.settings_policy"
);

const BADGES_MINTING = plutusBlueprint.validators.find(
  ({ title }) => title === "githoney_contract.badges_policy"
);

const BADGES_VALIDATOR = plutusBlueprint.validators.find(
  ({ title }) => title === "githoney_contract.badges_contract"
);

if (!GITHONEY_VALIDATOR) {
  throw new Error(
    "githoney validator indexed with 'main.githoney_validator' in plutus.json failed!"
  );
}

if (!GITHONEY_MINTING) {
  throw new Error(
    "Minting validator indexed with 'main.githoney_token_minting_policy' in plutus.json failed!"
  );
}

if (!SETTINGS_VALIDATOR) {
  throw new Error(
    "Settings validator indexed with 'main.githoney_settings_validator' in plutus.json failed!"
  );
}

if (!SETTINGS_MINTING) {
  throw new Error(
    "Settings policy indexed with 'main.githoney_settings_policy' in plutus.json failed!"
  );
}

if (!BADGES_MINTING) {
  throw new Error(
    "Badges policy indexed with 'main.githoney_badges_policy' in plutus.json failed!"
  );
}

if (!BADGES_VALIDATOR) {
  throw new Error(
    "Badges validator indexed with 'main.githoney_badges_validator' in plutus.json failed!"
  );
}

const GITHONEY_SCRIPT: SpendingValidator["script"] =
  GITHONEY_VALIDATOR.compiledCode;
const MINTING_SCRIPT: SpendingValidator["script"] =
  GITHONEY_MINTING.compiledCode;
const SETTINGS_SCRIPT: SpendingValidator["script"] =
  SETTINGS_VALIDATOR.compiledCode;
const SETTINGS_POLICY: SpendingValidator["script"] =
  SETTINGS_MINTING.compiledCode;
const BADGES_POLICY: SpendingValidator["script"] = BADGES_MINTING.compiledCode;
const BADGES_SCRIPT: SpendingValidator["script"] =
  BADGES_VALIDATOR.compiledCode;

const ParamsSchema = Data.Tuple([Data.Bytes()]);
type ParamsT = Data.Static<typeof ParamsSchema>;
const Params = ParamsSchema as unknown as ParamsT;

const OutRefSchema = Data.Object({
  txHash: Data.Object({ hash: Data.Bytes() }),
  outputIndex: Data.Integer()
});
const SettingsParamsSchema = Data.Tuple([OutRefSchema]);
type SettingsParamsT = Data.Static<typeof SettingsParamsSchema>;
const SettingsParams = SettingsParamsSchema as unknown as SettingsParamsT;

const BadgesPolicySchema = Data.Tuple([OutRefSchema, Data.Integer()]);
type BadgesPolicyT = Data.Static<typeof BadgesPolicySchema>;
const BadgesPolicy = BadgesPolicySchema as unknown as BadgesPolicyT;

function githoneyValidator(settingsPolicyId: PolicyId): SpendingValidator {
  return {
    type: "PlutusV2",
    script: applyParamsToScript<ParamsT>(
      GITHONEY_SCRIPT,
      [settingsPolicyId],
      Params
    )
  };
}

const GITHONEY_SCRIPT_HASH: ScriptHash = GITHONEY_VALIDATOR.hash;

function githoneyMintingPolicy(settingsPolicyId: PolicyId): SpendingValidator {
  return {
    type: "PlutusV2",
    script: applyParamsToScript<ParamsT>(
      MINTING_SCRIPT,
      [settingsPolicyId],
      Params
    )
  };
}

function settingsPolicy(outRef: OutRef): SpendingValidator {
  return {
    type: "PlutusV2",
    script: applyParamsToScript<SettingsParamsT>(
      SETTINGS_POLICY,
      [
        {
          txHash: { hash: outRef.txHash },
          outputIndex: BigInt(outRef.outputIndex)
        }
      ],
      SettingsParams
    )
  };
}

function settingsValidator(): SpendingValidator {
  return {
    type: "PlutusV2",
    script: SETTINGS_SCRIPT
  };
}

function badgesPolicy(outRef: OutRef, nonce: bigint): SpendingValidator {
  return {
    type: "PlutusV2",
    script: applyParamsToScript<BadgesPolicyT>(
      BADGES_POLICY,
      [
        {
          txHash: { hash: outRef.txHash },
          outputIndex: BigInt(outRef.outputIndex)
        },
        nonce
      ],
      BadgesPolicy
    )
  };
}

function badgesValidator(settingsPolicyId: PolicyId): SpendingValidator {
  return {
    type: "PlutusV2",
    script: applyParamsToScript<ParamsT>(
      BADGES_SCRIPT,
      [settingsPolicyId],
      Params
    )
  };
}

export {
  githoneyMintingPolicy,
  GITHONEY_SCRIPT_HASH,
  githoneyValidator,
  settingsPolicy,
  settingsValidator,
  badgesPolicy,
  badgesValidator
};
