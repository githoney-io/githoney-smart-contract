use aiken/transaction.{OutputReference, Redeemer, ScriptContext, Datum}
use aiken/transaction/value.{PolicyId}
use types.{
  AddRewards, Assign, Claim, Close, CloseSettings, GithoneyContractRedeemers,
  GithoneyDatum, Merge, SettingsDatum, SettingsRedeemers, UpdateSettings,
}
use validations.{
  add_rewards, assign, claim, close, close_settings, merge, minting_policy,
  minting_policy_settings, update_settings, reference_input_settings_with_NFT
}
use checks.{is_signed_by}
use aiken/list

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

validator(utxo_ref: OutputReference, nonce: Int) {
  fn badges_policy(_redeemer: Redeemer, ctx: ScriptContext) {
    let is_outref_in_inputs =
      list.any(
        ctx.transaction.inputs,
      fn(input) { input.output_reference == utxo_ref },
    )

    let is_valid_nonce = nonce >= 0

    is_outref_in_inputs? && is_valid_nonce?
  }
}

validator(settings_policy_id: PolicyId) {
  fn badges_contract(
    _datum: Datum,
    _redeemer: Redeemer,
    ctx: ScriptContext,
  ) {
    let settings_datum =
      reference_input_settings_with_NFT(ctx.transaction, settings_policy_id)
    let is_signed_by_githoney = is_signed_by(ctx.transaction, settings_datum.githoney_wallet.payment_key)
    is_signed_by_githoney
  }
}