use aiken/list
use aiken/option.{is_none, is_some}
use aiken/transaction.{Output, OutputReference, ScriptContext}
use aiken/transaction/credential.{ScriptCredential, from_script}
use aiken/transaction/value.{
  PolicyId, ada_asset_name, ada_policy_id, from_lovelace, quantity_of,
}
use checks.{
  is_assign_datum_valid, is_merge_datum_valid, is_signed_by,
  is_tx_before_deadline, is_utxo_datum_valid, is_utxo_value_valid,
}
use types.{SettingsDatum}
use utils.{
  get_first_output, get_minting_info, get_script_input, is_output_script_utxo,
  merge_payments_parts, min_ada, settings_nft_name, to_githoney_datum,
  value_grater_than, value_grater_than_or_equal, value_paid_to,
}

pub fn settings_nft_input_and_policy(ctx: ScriptContext) -> (Output, PolicyId) {
  let script_input = get_script_input(ctx).output
  expect ScriptCredential(control_token_policy) =
    script_input.address.payment_credential
  let is_there_one_control_token =
    quantity_of(script_input.value, control_token_policy, control_token_name) == 1
  if !is_there_one_control_token {
    fail @"There should be exactly one control token in the inputs"
  } else {
    (script_input, control_token_policy)
  }
}

validator {
  fn spend(
    datum: SettingsDatum,
    redeemer: SettingsRedeemers,
    ctx: ScriptContext,
  ) {
    when redeemer is {
      UpdateSettings -> {
        let is_signed =
          is_signed_by(ctx.transaction, datum.githoney_wallet.payment_key)
        is_signed?
      }
      CloseSettings -> {
        let (script_input, settings_nft_policy) =
          control_token_input_and_policy(ctx)
        let (policy_id, minted_name, minted_quantity) =
          get_minting_info(ctx.transaction)

        let is_settings_nft_burnt =
          minted_quantity == -1 && minted_name == settings_nft_name && policy_id == settings_nft_policy

        let is_signed =
          is_signed_by(ctx.transaction, datum.githoney_wallet.payment_key)
        //   let is_pay_valid =
        //     value_paid_to(datum.githoney_wallet, ctx.transaction) == (
        //       script_input.value
        //         |>
        //         |> value.add(control_token_policy, control_token_name, -1)
        //     )
        is_settings_nft_burnt? && is_signed?
      }
    }
  }
}

validator(utxo_ref: OutputReference) {
  fn policy(_redeemer: Redeemer, ctx: ScriptContext) {
    let (own_policy, minted_name, minted_quantity) =
      get_minting_info(ctx.transaction)

    let is_token_burned = minted_quantity == -1
    if is_token_burned {
      True
    } else {
      let is_minting_only_one_control_token =
        minted_quantity == 1 && minted_name == settings_nft_name

      expect Some(script_output) =
        list.find(
          ctx.transaction.outputs,
          fn(o) { o.output_reference == utxo_ref },
        )
      let datum = to_settings_datum(script_output.datum)

      is_minting_only_one_control_token?
    }
  }
}
