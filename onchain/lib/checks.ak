use aiken/interval.{Finite}
use aiken/option.{is_some}
use aiken/transaction.{ScriptContext, Transaction}
use aiken/transaction/value.{
  Value, from_asset, from_lovelace, is_zero, merge, negate, quantity_of,
}
use types.{GithoneyContractRedeemers, GithoneyDatum, GithoneyFee}
use utils.{control_token_name, min_ada}

pub fn is_utxo_value_valid(policy_id: ByteArray, value: Value) {
  let is_control_token_in_output =
    quantity_of(value, policy_id, control_token_name) == 1
  let there_are_some_reward =
    from_lovelace(min_ada)
      |> merge(from_asset(policy_id, control_token_name, 1))
      |> negate
      |> merge(value)
      |> is_zero // this works?
      |> not

  is_control_token_in_output && there_are_some_reward
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
  let ScriptContext { transaction, purpose } = ctx

  expect Mint(minted_policy_id) = purpose

  let Transaction { mint, .. } = transaction

  let minted =
    mint
      |> value.from_minted_value()

  let minted_length = list.length(value.flatten(minted))

  expect [(minted_asset_name, minted_amount)] =
    minted
      |> value.tokens(minted_policy_id)
      |> dict.to_list()

  if minted_amount == 1 {
    // MINT
    // check correct datum structure and one script output
    let bounty_utxo =
      transaction
        |> utils.get_script_output()

    // let githoney_datum = utils.to_githoney_datum(bounty_utxo.datum)
    // let check_value = todo
    expect ScriptCredential(addr_payment) =
      bounty_utxo.address.payment_credential

    let check_paid_address = githoney_address == addr_payment

    check_paid_address? && check_value?
  } else {
    // BURN
    let check_burn =
      list.length(value.flatten(minted)) == 1 && minted_amount == -1
    let check_no_script_outputs =
      transaction.outputs
        |> list.filter(utils.is_output_script_utxo)
        |> list.is_empty()
    check_no_script_outputs? && check_burn?
  }
}
