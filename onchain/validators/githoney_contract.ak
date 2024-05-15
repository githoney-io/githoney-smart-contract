
use aiken/transaction.{ ScriptContext, Redeemer }
use aiken/transaction/value.{ merge, negate, from_lovelace, quantity_of }
use aiken/transaction/credential.{ ScriptCredential, from_script }
use aiken/option.{ is_none, is_some }
use types.{
  GithoneyContractRedeemers, AddRewards, Assign, Merge, Close, Claim,
  GithoneyFee, GithoneyDatum }
use utils.{ value_grater_than, get_script_input, get_first_output, get_minting_info,
  to_githoney_datum, control_token_name, value_paid_to, min_ada }
use checks.{ is_utxo_value_valid, is_utxo_datum_valid, is_tx_before_deadline,
  is_assign_datum_valid, is_merge_datum_valid }

validator(githoney_fee: GithoneyFee){
  fn githoney_contract(datum: GithoneyDatum, redeemer: GithoneyContractRedeemers, ctx: ScriptContext){
    let script_input = get_script_input(ctx).output
    let is_tx_before_deadline = is_tx_before_deadline(ctx.transaction, datum.deadline)
    expect ScriptCredential(control_token_policy) = script_input.address.payment_credential
    let is_control_token_in_input =
      quantity_of(script_input.value, control_token_policy, control_token_name) == 1

    if !is_control_token_in_input {
      False
    } else {
      when redeemer is {
        AddRewards -> {
          let script_output = get_first_output(ctx)
          let new_datum = to_githoney_datum(script_output)

          let is_datum_the_same = datum == new_datum
          let is_value_grater_than_before = value_grater_than(script_output.value, script_input.value)
          let is_utxo_address_the_same = script_input.address == script_output.address

          is_datum_the_same? &&
          is_tx_before_deadline? &&
          is_utxo_address_the_same? &&
          is_value_grater_than_before?
        }

        Assign -> {
          let script_output = get_first_output(ctx)
          let new_datum = to_githoney_datum(script_output)

          let contributor_isnt_assigned = is_none(datum.contributor_wallet)
          let is_new_datum_valid = is_assign_datum_valid(datum, new_datum)
          let is_utxo_address_the_same = script_input.address == script_output.address
          let expected_value = merge(script_input.value, from_lovelace(min_ada))
          let is_utxo_value_valid = script_output.value == expected_value

          is_new_datum_valid? &&
          is_utxo_value_valid? &&
          is_tx_before_deadline? &&
          is_utxo_address_the_same? &&
          contributor_isnt_assigned?
        }
        Merge -> {
          let script_output = get_first_output(ctx)
          let new_datum = to_githoney_datum(script_output)
          let min_ada_value = from_lovelace(min_ada)

          let merged_field_is_false = !datum.merged
          let contributor_is_assigned = is_some(datum.contributor_wallet)
          let is_new_datum_valid = is_merge_datum_valid(datum, new_datum)
          let is_utxo_address_the_same = script_input.address == script_output.address
          let expected_value = merge(script_input.value, negate(min_ada_value))
          let is_utxo_value_valid = script_output.value == expected_value
          let is_maintainer_minada_payed =
            value_paid_to(datum.maintainer_wallet, ctx.transaction) == min_ada_value

          is_new_datum_valid? &&
          is_utxo_value_valid? &&
          is_tx_before_deadline? &&
          merged_field_is_false? &&
          contributor_is_assigned? &&
          is_utxo_address_the_same? &&
          is_maintainer_minada_payed?
        }
        Close -> True
        Claim -> True
      }
    }

  }

  fn githoney_policy(_redeemer:Redeemer, ctx: ScriptContext){
    let (own_policy, minted_name, minted_quantity) = get_minting_info(ctx.transaction)

    let is_token_burned = minted_quantity == -1
    if is_token_burned { True }
    else{
      let script_output = get_first_output(ctx)
      let datum = to_githoney_datum(script_output)

      let is_minting_only_one_control_token =
        minted_quantity == 1 && minted_name == control_token_name
      let is_script_output_address_valid = script_output.address == from_script(own_policy)
      let is_creation_fee_paid =
        value_paid_to(githoney_fee.githoney_wallet, ctx.transaction)
          == from_lovelace(githoney_fee.bounty_creation_fee)

      is_creation_fee_paid &&
      is_minting_only_one_control_token &&
      is_script_output_address_valid &&
      is_utxo_datum_valid(ctx.transaction, datum) &&
      is_utxo_value_valid(own_policy, script_output.value)
    }
  }
}