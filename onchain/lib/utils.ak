use aiken/collection/list
use cardano/address.{Address, Script}
use cardano/assets.{
  AssetName, PolicyId, Value, flatten, from_asset, from_lovelace, match, merge,
  quantity_of, reduce, zero,
}
use cardano/transaction.{
  Datum, InlineDatum, Input, Output, Transaction,
}
use types.{GithoneyDatum, SettingsDatum}

pub const settings_token_name: ByteArray = "settingsNFT"

pub const min_ada: Int = 3_000_000

pub const max_amount_of_tokens_admiteed: Int = 15

// Returns the minting information of a transaction.
pub fn get_minting_info(tx: Transaction) -> (PolicyId, AssetName, Int) {
  expect [info] = tx.mint |> flatten
  info
}

// Converts an arbitrary Data type into a GithoneyDatum.
pub fn to_githoney_datum(data: Data) -> GithoneyDatum {
  expect InlineDatum(datum): Datum = data
  expect githoney_datum: GithoneyDatum = datum
  githoney_datum
}

pub fn to_settings_datum(data: Data) -> SettingsDatum {
  expect InlineDatum(datum): Datum = data
  expect settings_datum: SettingsDatum = datum
  settings_datum
}

// Verifies if an input UTxO belongs to a script.
pub fn is_script_utxo(input: Input) -> Bool {
  when input.output.address.payment_credential is {
    Script(_) -> True
    _ -> False
  }
}

pub fn get_unique_script_input(
  inputs: List<Input>,
) -> Input {
  expect [input] =
    inputs
      |> list.filter(is_script_utxo)
  input
}

pub fn value_greater_than(v1: Value, v2: Value) {
  let are_different = match(v1, v2, ==) |> not
  let greater_or_equal = value_greater_than_or_equal(v1, v2)

  greater_or_equal? && are_different?
}

pub fn value_greater_than_or_equal(v1: Value, v2: Value) {
  reduce(
    v2,
    True,
    fn(policy_id, token_name, quantity, acc) {
      let v1_quantity = quantity_of(v1, policy_id, token_name)
      if v1_quantity < quantity {
        acc && False
      } else {
        acc && True
      }
    },
  )
}

test test_greater_than_with_more_policies() {
  let v1 =
    merge(
      from_asset("policy2", "token2", 2),
      from_asset("policy1", "token1", 1),
    )
  let v2 = from_asset("policy1", "token1", 1)
  True == value_greater_than(v1, v2)
}

test test_greater_than_with_higher_quantities() {
  let v1 = from_asset("policy3", "token3", 2)
  let v2 = from_asset("policy3", "token3", 1)
  True == value_greater_than(v1, v2)
}

test test_greater_than_with_incomparable_values() {
  let v1 =
    merge(
      from_asset("policy2", "token2", 2),
      from_asset("policy1", "token1", 1),
    )
  let v2 =
    merge(
      from_asset("policy2", "token2", 2),
      from_asset("policy3", "token3", 1),
    )
  False == value_greater_than(v1, v2)
}

pub fn merge_payments_parts(
  reward_fee: Int,
  script_value: Value,
  bounty_id_policy: PolicyId,
  bounty_id_name: AssetName,
) -> (Value, Value) {
  let reward_value = merge(script_value, from_lovelace(-(2 * min_ada)))
  let managment_assets =
    merge(
      from_asset(bounty_id_policy, bounty_id_name, 1),
      from_lovelace(min_ada),
    )
  let (script_part, fee_part) =
    reward_value
      |> reduce(
          (managment_assets, zero),
          fn(policy_id, token_name, quantity, acc) {
            if policy_id == bounty_id_policy {
              acc
            } else {
              let (reward, fee) = acc
              let fee_amount = quantity * reward_fee / ( 100 * 100 )
              let reward_amount = quantity - fee_amount
              (
                merge(reward, from_asset(policy_id, token_name, reward_amount)),
                merge(fee, from_asset(policy_id, token_name, fee_amount)),
              )
            }
          },
        )
  (script_part, fee_part)
}
