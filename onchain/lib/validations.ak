use aiken/option.{is_none, is_some}
use aiken/transaction.{Output, ScriptContext}
use aiken/transaction/credential.{ScriptCredential, from_script}
use aiken/transaction/value.{
  PolicyId, ada_asset_name, ada_policy_id, from_lovelace, quantity_of,
}
use checks.{
  is_assign_datum_valid, is_merge_datum_valid, is_signed_by,
  is_tx_before_deadline, is_utxo_datum_valid, is_utxo_value_valid,
}
use types.{GithoneyDatum, GithoneyFee}
use utils.{
  control_token_name, get_first_output, get_minting_info, get_script_input,
  merge_payments_parts, min_ada, to_githoney_datum, value_grater_than,
  value_grater_than_or_equal, value_paid_to,
}

pub fn control_token_input_and_policy(ctx: ScriptContext) -> (Output, PolicyId) {
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

pub fn add_rewards(datum: GithoneyDatum, ctx: ScriptContext) -> Bool {
  let (script_input, _) = control_token_input_and_policy(ctx)
  let script_output = get_first_output(ctx)
  let new_datum = to_githoney_datum(script_output.datum)

  let is_tx_before_deadline =
    is_tx_before_deadline(ctx.transaction, datum.deadline)
  let is_datum_the_same = datum == new_datum
  let is_value_grater_than_before =
    value_grater_than(script_output.value, script_input.value)
  let is_utxo_address_the_same = script_input.address == script_output.address

  is_datum_the_same? && is_tx_before_deadline? && is_utxo_address_the_same? && is_value_grater_than_before?
}

pub fn assign(datum: GithoneyDatum, ctx: ScriptContext) -> Bool {
  let (script_input, _) = control_token_input_and_policy(ctx)
  let script_output = get_first_output(ctx)
  let new_datum = to_githoney_datum(script_output.datum)

  let is_tx_before_deadline =
    is_tx_before_deadline(ctx.transaction, datum.deadline)
  let contributor_isnt_assigned = is_none(datum.contributor_wallet)
  let is_new_datum_valid = is_assign_datum_valid(datum, new_datum)
  let is_utxo_address_the_same = script_input.address == script_output.address
  let expected_value = value.merge(script_input.value, from_lovelace(min_ada))
  let is_utxo_value_valid = script_output.value == expected_value

  is_new_datum_valid? && is_utxo_value_valid? && is_tx_before_deadline? && is_utxo_address_the_same? && contributor_isnt_assigned?
}

pub fn merge(
  githoney_fee: GithoneyFee,
  datum: GithoneyDatum,
  ctx: ScriptContext,
) -> Bool {
  let (script_input, control_token_policy) = control_token_input_and_policy(ctx)
  let script_output = get_first_output(ctx)
  let new_datum = to_githoney_datum(script_output.datum)
  let min_ada_value = from_lovelace(min_ada)

  let is_tx_before_deadline =
    is_tx_before_deadline(ctx.transaction, datum.deadline)
  let contributor_is_assigned = is_some(datum.contributor_wallet)
  let is_new_datum_valid = is_merge_datum_valid(datum, new_datum)
  let is_utxo_address_the_same = script_input.address == script_output.address
  let (script_value, githoney_value) =
    merge_payments_parts(
      githoney_fee.bounty_reward_fee,
      script_input.value,
      control_token_policy,
    )
  let is_utxo_value_valid = script_output.value == script_value
  let is_githoney_fee_payed =
    value_grater_than_or_equal(
      value_paid_to(githoney_fee.githoney_wallet, ctx.transaction),
      githoney_value,
    )
  let is_signed_by_admin =
    is_signed_by(ctx.transaction, datum.admin_wallet.payment_key)
  let is_maintainer_minada_payed =
    value_paid_to(datum.maintainer_wallet, ctx.transaction) == min_ada_value
  let is_datum_not_merged = !datum.merged

  is_datum_not_merged? && is_signed_by_admin? && is_new_datum_valid? && is_utxo_value_valid? && is_tx_before_deadline? && contributor_is_assigned? && is_utxo_address_the_same? && is_maintainer_minada_payed? && is_githoney_fee_payed?
}

pub fn close(datum: GithoneyDatum, ctx: ScriptContext) -> Bool {
  let (script_input, control_token_policy) = control_token_input_and_policy(ctx)
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
          value_paid_to(datum.maintainer_wallet, ctx.transaction) == (
            script_input.value
              |> value.add(ada_policy_id, ada_asset_name, -min_ada)
              |> value.add(control_token_policy, control_token_name, -1)
          )
        is_contributor_pay_valid? && is_maintainer_pay_valid?
      }
      None -> {
        let is_maintainer_pay_valid =
          value_paid_to(datum.maintainer_wallet, ctx.transaction) == (
            script_input.value
              |> value.add(control_token_policy, control_token_name, -1)
          )
        is_maintainer_pay_valid?
      }
    }

  let is_signed_by_admin =
    is_signed_by(ctx.transaction, datum.admin_wallet.payment_key)
  let is_control_token_burnt =
    minted_quantity == -1 && minted_name == control_token_name && policy_id == control_token_policy
  let is_datum_not_merged = !datum.merged

  is_datum_not_merged? && is_signed_by_admin? && are_payments_valid? && is_control_token_burnt?
}

pub fn claim(datum: GithoneyDatum, ctx: ScriptContext) -> Bool {
  let (script_input, control_token_policy) = control_token_input_and_policy(ctx)
  expect Some(contributor_wallet) = datum.contributor_wallet

  let (policy_id, minted_name, minted_quantity) =
    get_minting_info(ctx.transaction)
  let is_contributor_pay_valid =
    value_paid_to(contributor_wallet, ctx.transaction) == script_input.value
  let is_control_token_burnt =
    minted_quantity == -1 && minted_name == control_token_name && policy_id == control_token_policy

  datum.merged? && is_control_token_burnt? && is_contributor_pay_valid?
}

// Main validation of the githoney token minting policy
pub fn minting_policy(githoney_fee: GithoneyFee, ctx: ScriptContext) -> Bool {
  let (own_policy, minted_name, minted_quantity) =
    get_minting_info(ctx.transaction)

  let is_token_burned = minted_quantity == -1
  if is_token_burned {
    True
  } else {
    let script_output = get_first_output(ctx)
    let datum = to_githoney_datum(script_output.datum)

    let is_minting_only_one_control_token =
      minted_quantity == 1 && minted_name == control_token_name

    let is_script_output_address_valid =
      script_output.address == from_script(own_policy)
    let is_creation_fee_paid =
      value_paid_to(githoney_fee.githoney_wallet, ctx.transaction) == from_lovelace(
        githoney_fee.bounty_creation_fee,
      )

    let valid_datum = is_utxo_datum_valid(ctx.transaction, datum)
    let valid_value = is_utxo_value_valid(own_policy, script_output.value)

    is_creation_fee_paid? && is_minting_only_one_control_token? && is_script_output_address_valid? && valid_datum? && valid_value?
  }
}
