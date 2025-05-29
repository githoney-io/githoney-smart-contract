use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/interval.{Finite}
use aiken/option.{is_none, is_some}
use cardano/address.{Address, Credential, VerificationKey}
use cardano/assets.{PolicyId, Value, add, from_lovelace, quantity_of}
use cardano/transaction.{Output, Transaction, ValidityRange}
use types.{GithoneyDatum, SettingsDatum}
use utils.{min_ada, settings_token_name, to_settings_datum, value_greater_than}

pub fn is_signed_by(
  extra_signatories: List<VerificationKeyHash>,
  verification_key: Credential,
) {
  expect VerificationKey(vk) = verification_key
  list.has(extra_signatories, vk)
}

pub fn is_utxo_value_valid(
  policy_id: ByteArray,
  bounty_id: ByteArray,
  value: Value,
) {
  let min_value = from_lovelace(min_ada) |> add(policy_id, bounty_id, 1)
  value_greater_than(value, min_value)
}

pub fn is_utxo_datum_valid(
  reward_fee: Int,
  tx: Transaction,
  datum: GithoneyDatum,
) {
  (datum.merged == False)? && is_tx_before_deadline(
    tx.validity_range,
    datum.deadline,
  )? && is_none(datum.contributor_address)? && (datum.bounty_reward_fee == reward_fee)?
}

pub fn is_tx_before_deadline(validity_range: ValidityRange, deadline: Int) {
  when validity_range.upper_bound.bound_type is {
    Finite(tx_upper_bound) -> deadline >= tx_upper_bound
    _ -> False
  }
}

pub fn is_assign_datum_valid(old_datum: GithoneyDatum, new_datum: GithoneyDatum) {
  let expected_datum =
    GithoneyDatum {
      ..old_datum,
      contributor_address: new_datum.contributor_address,
    }
  new_datum == expected_datum && is_some(new_datum.contributor_address)
}

pub fn is_merge_datum_valid(old_datum: GithoneyDatum, new_datum: GithoneyDatum) {
  let expected_datum = GithoneyDatum { ..old_datum, merged: True }
  new_datum == expected_datum
}

pub fn utxo_at_paid_to_address(outputs: List<Output>, address: Address, at: Int) {
  expect Some(output) = outputs |> list.at(at)
  if output.address == address {
    output
  } else {
    fail @"address missmatch"
  }
}

pub fn reference_input_settings_with_NFT(
  tx: Transaction,
  settings_policy_id: PolicyId,
) -> SettingsDatum {
  expect [ref_input] = tx.reference_inputs
  let has_settings_policy =
    quantity_of(ref_input.output.value, settings_policy_id, settings_token_name) == 1
  if !has_settings_policy {
    fail @"There should be exactly one settings NFT in the reference input"
  } else {
    to_settings_datum(ref_input.output.datum)
  }
}
