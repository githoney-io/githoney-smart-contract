use aiken/transaction.{OutputReference, Redeemer, ScriptContext}
use aiken/transaction/value.{PolicyId}
use types.{
  AddRewards, Assign, Claim, Close, CloseSettings, GithoneyContractRedeemers,
  GithoneyDatum, Merge, SettingsDatum, SettingsRedeemers, UpdateSettings,
}
use validations.{
  add_rewards, assign, claim, close, close_settings, merge, minting_policy,
  minting_policy_settings, update_settings,
}

validator(settings_policy_id: PolicyId) {
  fn githoney_contract(
    datum: GithoneyDatum,
    redeemer: GithoneyContractRedeemers,
    ctx: ScriptContext,
  ) {
    when redeemer is {
      AddRewards -> add_rewards(datum, ctx)
      Assign -> assign(datum, ctx)
      Merge -> merge(settings_policy_id, datum, ctx)
      Close -> close(datum, ctx)
      Claim -> claim(datum, ctx)
    }
  }

  fn githoney_policy(_redeemer: Redeemer, ctx: ScriptContext) {
    minting_policy(settings_policy_id, ctx)
  }
}

validator {
  fn settings_contract(
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
  fn settings_policy(_redeemer: Redeemer, ctx: ScriptContext) {
    minting_policy_settings(utxo_ref, ctx)
  }
}
