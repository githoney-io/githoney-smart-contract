use aiken/cbor
use aiken/interval.{Finite}
use aiken/option.{is_some}
use aiken/transaction.{ScriptContext, Transaction}
use aiken/transaction/credential.{from_script}
use aiken/transaction/value.{
  Value, from_asset, from_lovelace, is_zero, merge, negate, quantity_of,
}
use types.{GithoneyContractRedeemers, GithoneyDatum, GithoneyFee}
use utils.{
  control_token_name, get_first_output, get_minting_info, min_ada,
  to_githoney_datum, value_paid_to,
}

pub fn is_utxo_value_valid(policy_id: ByteArray, value: Value) {
  let is_control_token_in_output =
    quantity_of(value, policy_id, control_token_name) == 1
  let there_are_some_reward =
    from_lovelace(min_ada)
      |> merge(from_asset(policy_id, control_token_name, 1))
      |> negate
      |> merge(value)
      |> is_zero
      |> not

  is_control_token_in_output? && there_are_some_reward?
}

pub fn is_utxo_datum_valid(tx: Transaction, datum: GithoneyDatum) {
  datum.merged == False && is_tx_before_deadline(tx, datum.deadline)
}

pub fn is_tx_before_deadline(tx: Transaction, deadline: Int) {
  when tx.validity_range.upper_bound.bound_type is {
    Finite(tx_upper_bound) -> deadline >= tx_upper_bound
    _ -> False
  }
}

pub fn is_tx_after_deadline(tx: Transaction, deadline: Int) {
  when tx.validity_range.lower_bound.bound_type is {
    Finite(tx_lower_bound) -> deadline <= tx_lower_bound
    _ -> False
  }
}

pub fn is_assign_datum_valid(old_datum: GithoneyDatum, new_datum: GithoneyDatum) {
  let expected_datum =
    GithoneyDatum {
      ..old_datum,
      contributor_wallet: new_datum.contributor_wallet,
    }
  new_datum == expected_datum && is_some(new_datum.contributor_wallet)
}

pub fn is_merge_datum_valid(old_datum: GithoneyDatum, new_datum: GithoneyDatum) {
  let expected_datum = GithoneyDatum { ..old_datum, merged: True }
  new_datum == expected_datum
}

// Main validation of the githoney token minting policy
pub fn check_minting_policy(
  githoney_fee: GithoneyFee,
  _redeemer: GithoneyContractRedeemers,
  ctx: ScriptContext,
) -> Bool {
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

    is_creation_fee_paid? && is_minting_only_one_control_token? && is_script_output_address_valid? && valid_datum && valid_value?
  }
}
