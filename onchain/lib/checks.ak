use aiken/transaction/value.{Value, quantity_of, from_lovelace, from_asset, is_zero, negate, merge}
use aiken/transaction.{Transaction}
use aiken/interval.{Finite}
use types.{ GithoneyDatum }
use utils.{control_token_name, min_ada}

pub fn is_utxo_value_valid(policy_id: ByteArray, value: Value){
  let is_control_token_in_output = quantity_of(value, policy_id, control_token_name) == 1
  let there_are_some_reward =
    !(from_lovelace(min_ada)
      |> merge(from_asset(policy_id, control_token_name, 1))
      |> negate
      |> merge(value)
      |> is_zero)

  is_control_token_in_output && there_are_some_reward
}

pub fn is_utxo_datum_valid(tx: Transaction, datum: GithoneyDatum){
  datum.merged == False &&
  is_tx_before_deadline(tx, datum.deadline)
}

pub fn is_tx_before_deadline(tx: Transaction, deadline: Int) {
  when tx.validity_range.upper_bound.bound_type is {
    Finite(tx_upper_bound) ->
      deadline >= tx_upper_bound
    _ ->
      False
  }
}

pub fn is_tx_after_deadline(tx: Transaction, deadline: Int) {
  when tx.validity_range.lower_bound.bound_type is {
    Finite(tx_lower_bound) ->
      deadline <= tx_lower_bound
    _ ->
      False
  }
}