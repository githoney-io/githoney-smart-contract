use aiken/option.{is_none, is_some}
use aiken/transaction.{Redeemer, ScriptContext}
use aiken/transaction/credential.{ScriptCredential}
use aiken/transaction/value.{from_lovelace, merge, negate, quantity_of}
use checks.{is_assign_datum_valid, is_merge_datum_valid, is_tx_before_deadline}
use types.{
  AddRewards, Assign, Claim, Close, GithoneyContractRedeemers, GithoneyDatum,
  GithoneyFee, Merge,
}
use utils.{
  control_token_name, get_first_output, get_minting_info, get_script_input,
  is_signed_by, min_ada, to_githoney_datum, value_grater_than, value_paid_to,
}

validator(githoney_fee: GithoneyFee) {
  fn githoney_contract(
    datum: GithoneyDatum,
    redeemer: GithoneyContractRedeemers,
    ctx: ScriptContext,
  ) {
    let script_input = get_script_input(ctx).output
    let is_tx_before_deadline =
      is_tx_before_deadline(ctx.transaction, datum.deadline)
    expect ScriptCredential(control_token_policy) =
      script_input.address.payment_credential
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
          let is_value_grater_than_before =
            value_grater_than(script_output.value, script_input.value)
          let is_utxo_address_the_same =
            script_input.address == script_output.address

          is_datum_the_same? && is_tx_before_deadline? && is_utxo_address_the_same? && is_value_grater_than_before?
        }

        Assign -> {
          let script_output = get_first_output(ctx)
          let new_datum = to_githoney_datum(script_output)

          let contributor_isnt_assigned = is_none(datum.contributor_wallet)
          let is_new_datum_valid = is_assign_datum_valid(datum, new_datum)
          let is_utxo_address_the_same =
            script_input.address == script_output.address
          let expected_value = merge(script_input.value, from_lovelace(min_ada))
          let is_utxo_value_valid = script_output.value == expected_value

          is_new_datum_valid? && is_utxo_value_valid? && is_tx_before_deadline? && is_utxo_address_the_same? && contributor_isnt_assigned?
        }

        Merge -> {
          let script_output = get_first_output(ctx)
          let new_datum = to_githoney_datum(script_output)
          let min_ada_value = from_lovelace(min_ada)

          let contributor_is_assigned = is_some(datum.contributor_wallet)
          let is_new_datum_valid = is_merge_datum_valid(datum, new_datum)
          let is_utxo_address_the_same =
            script_input.address == script_output.address
          let expected_value = merge(script_input.value, negate(min_ada_value))
          let is_utxo_value_valid = script_output.value == expected_value
          let is_signed_by_admin =
            is_signed_by(ctx.transaction, datum.admin_wallet.payment_key)
          let is_maintainer_minada_payed =
            value_paid_to(datum.maintainer_wallet, ctx.transaction) == min_ada_value

          !datum.merged? && is_signed_by_admin? && is_new_datum_valid? && is_utxo_value_valid? && is_tx_before_deadline? && contributor_is_assigned? && is_utxo_address_the_same? && is_maintainer_minada_payed?
        }

        Close -> {
          let (policy_id, minted_name, minted_quantity) =
            get_minting_info(ctx.transaction)
          let are_payments_valid =
            when datum.contributor_wallet is {
              Some(contributor_wallet) -> {
                let is_contributor_pay_valid =
                  value_paid_to(contributor_wallet, ctx.transaction) == from_lovelace(
                    min_ada,
                  )
                let is_maintainer_pay_valid =
                  value_paid_to(datum.maintainer_wallet, ctx.transaction) == merge(
                    script_input.value,
                    negate(from_lovelace(min_ada)),
                  )
                is_contributor_pay_valid? && is_maintainer_pay_valid?
              }
              None ->
                value_paid_to(datum.maintainer_wallet, ctx.transaction) == script_input.value
            }

          let is_signed_by_admin =
            is_signed_by(ctx.transaction, datum.admin_wallet.payment_key)
          let is_control_token_burnt =
            minted_quantity == -1 && minted_name == control_token_name && policy_id == control_token_policy

          !datum.merged? && is_signed_by_admin? && are_payments_valid? && is_control_token_burnt?
        }

        Claim -> {
          expect Some(contributor_wallet) = datum.contributor_wallet

          let (policy_id, minted_name, minted_quantity) =
            get_minting_info(ctx.transaction)
          let is_contributor_pay_valid =
            value_paid_to(contributor_wallet, ctx.transaction) == script_input.value
          let is_control_token_burnt =
            minted_quantity == -1 && minted_name == control_token_name && policy_id == control_token_policy

          datum.merged? && is_control_token_burnt? && is_contributor_pay_valid?
        }
      }
    }
  }

  fn githoney_policy(_redeemer: Redeemer, ctx: ScriptContext) {
    checks.check_minting_policy(githoney_fee, ctx)
  }
}
