use aiken/transaction.{OutputReference, Redeemer, ScriptContext}
use types.{CloseSettings, SettingsDatum, SettingsRedeemers, UpdateSettings}
use validations.{close_settings, minting_policy_settings, update_settings}

validator {
  fn spend(
    datum: SettingsDatum,
    redeemer: SettingsRedeemers,
    ctx: ScriptContext,
  ) {
    when redeemer is {
      UpdateSettings -> update_settings(datum, ctx)
      CloseSettings -> close_settings(datum, ctx)
    }
  }
}

validator(utxo_ref: OutputReference) {
  fn policy(_redeemer: Redeemer, ctx: ScriptContext) {
    minting_policy_settings(utxo_ref, ctx)
  }
}
