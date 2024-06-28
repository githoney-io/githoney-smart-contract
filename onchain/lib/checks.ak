use aiken/interval.{Finite}
use aiken/list
use aiken/option.{is_none, is_some}
use aiken/transaction.{Transaction}
use aiken/transaction/value.{
  Value, from_asset, from_lovelace, is_zero, merge, negate, quantity_of,
}
use types.{GithoneyDatum, VerificationKeyHash}
use utils.{min_ada}

pub fn is_signed_by(transaction: Transaction, vk: VerificationKeyHash) {
  list.has(transaction.extra_signatories, vk)
}

pub fn is_utxo_value_valid(policy_id: ByteArray, bounty_id: ByteArray, value: Value) {
  let is_bounty_id_token_in_output =
    quantity_of(value, policy_id, bounty_id) == 1
  let there_are_some_reward =
    from_lovelace(min_ada)
      |> merge(from_asset(policy_id, bounty_id, 1))
      |> negate
      |> merge(value)
      |> is_zero
      |> not

  is_bounty_id_token_in_output? && there_are_some_reward?
}

pub fn is_utxo_datum_valid(
  reward_fee: Int,
  tx: Transaction,
  datum: GithoneyDatum,
) {
  (datum.merged == False)? && is_tx_before_deadline(tx, datum.deadline)? && is_none(
    datum.contributor_wallet,
  )? && (datum.bounty_reward_fee == reward_fee)?
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
