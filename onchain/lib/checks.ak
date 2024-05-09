use aiken/transaction/value.{Value, from_lovelace, from_asset, is_zero, negate}
use utils.{control_token_name, min_ada}

pub fn is_utxo_value_valid(policy_id: ByteArray, value: Value){
  let is_control_token_in_output = quantity_of(value, policy_id, control_token_name) == 1
  let there_are_some_reward =
    !from_lovelace(min_ada)
      |> merge(from_asset(policy_id, control_token_name, 1))
      |> negate
      |> merge(value)
      |> is_zero

  is_control_token_in_output && there_are_some_reward
}