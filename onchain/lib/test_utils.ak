use aiken/collection/dict.{Dict}
use aiken/collection/list.{at, concat, head, push, span, tail}
use aiken/crypto.{DataHash}
use aiken/interval.{Finite, Interval, IntervalBound}
use aiken/option
use aiken/primitive/bytearray
use cardano/address.{Address}
use cardano/assets.{Value}
use cardano/transaction.{
  InlineDatum, Input, Mint, NoDatum, Output, OutputReference, Redeemer,
  ScriptPurpose, Spend, Transaction,
}
use mocks
use types.{GithoneyDatum}

/// Converts a given ScriptPurpose into a ByteArray representation.
///
/// This function is primarily designed to offer a way to uniquely represent different
/// `ScriptPurpose` variants in a `ByteArray` format. This is useful for operations like
/// comparisons, especially when we want to store these in a dictionary.
///
/// # Parameters:
/// - `sp`: The `ScriptPurpose` instance that needs to be converted.
///
/// # Returns:
/// A `ByteArray` representation of the provided `ScriptPurpose`.
fn script_purpose_to_byte_array(sp: ScriptPurpose) -> ByteArray {
  when sp is {
    Spend(ref) -> ref.transaction_id
    Mint(policy_id) -> policy_id

    // Default case to handle any other unexpected variants.
    // It returns a generic ByteArray representation of "0".
    _ -> "0"
  }
}

/// Compares two ScriptPurpose instances.
///
/// This function leverages the `script_purpose_to_byte_array` function to convert each
/// `ScriptPurpose` into a `ByteArray` and then performs a comparison.
///
/// # Parameters:
/// - `a`: The first `ScriptPurpose` instance.
/// - `b`: The second `ScriptPurpose` instance.
///
/// # Returns:
/// An `Ordering` result (`Less`, `Equal`, or `Greater`) based on the comparison of the ByteArray
/// representations of the provided `ScriptPurpose` instances.
pub fn script_purpose_compare(a: ScriptPurpose, b: ScriptPurpose) -> Ordering {
  let byte_a = script_purpose_to_byte_array(a)
  let byte_b = script_purpose_to_byte_array(b)

  bytearray.compare(byte_a, byte_b)
}

pub fn add_extra_signature(tx: Transaction, signature: ByteArray) {
  Transaction {
    ..tx,
    extra_signatories: tx.extra_signatories |> push(signature),
  }
}

pub fn add_output(tx: Transaction, output: Output) {
  Transaction { ..tx, outputs: concat(tx.outputs, [output]) }
}

pub fn add_input(tx: Transaction, input: Input) {
  Transaction { ..tx, inputs: concat(tx.inputs, [input]) }
}

pub fn input_with_assets(
  transaction_id: ByteArray,
  output_index: Int,
  address: Address,
  value: Value,
) -> Input {
  Input {
    output_reference: OutputReference { transaction_id, output_index },
    output: Output { address, value, datum: NoDatum, reference_script: None },
  }
}

pub fn change_output_value(tx: Transaction, index: Int, new_value: Value) {
  expect Some(output) = at(tx.outputs, index)
  let output = Output { ..output, value: new_value }
  let (out1, out2) = span(tx.outputs, index)
  expect Some(out2) = tail(out2)
  let out2 = out2 |> push(output)
  Transaction { ..tx, outputs: concat(out1, out2) }
}

pub fn change_output_address(tx: Transaction, index: Int, new_address: Address) {
  expect Some(output) = at(tx.outputs, index)
  let output = Output { ..output, address: new_address }
  let (out1, out2) = span(tx.outputs, index)
  expect Some(out2) = tail(out2)
  let out2 = out2 |> push(output)
  Transaction { ..tx, outputs: concat(out1, out2) }
}

pub fn change_input_value(tx: Transaction, index: Int, new_value: Value) {
  expect Some(input) = at(tx.inputs, index)
  let input =
    Input { ..input, output: Output { ..input.output, value: new_value } }
  let (inp1, inp2) = span(tx.inputs, index)
  expect Some(inp2) = tail(inp2)
  let inp2 = inp2 |> push(input)
  Transaction { ..tx, inputs: concat(inp1, inp2) }
}

pub fn script_input_without_bounty_id_token(tx: Transaction) {
  expect Some(script_input) = head(tx.inputs)
  let new_value =
    assets.merge(
      script_input.output.value,
      assets.from_asset(mocks.bounty_id_policy, mocks.bounty_id_name, -1),
    )
  change_input_value(tx, 0, new_value)
}

pub fn script_input_with_two_bounty_id_token(tx: Transaction) {
  expect Some(script_input) = head(tx.inputs)
  let new_value =
    assets.merge(
      script_input.output.value,
      assets.from_asset(mocks.bounty_id_policy, mocks.bounty_id_name, 1),
    )
  change_input_value(tx, 0, new_value)
}

pub fn script_input_without_settings_nft(tx: Transaction) {
  expect Some(script_input) = head(tx.inputs)
  let new_value =
    assets.merge(
      script_input.output.value,
      assets.from_asset(
        mocks.settings_nft_policy,
        mocks.settings_token_name,
        -1,
      ),
    )
  change_input_value(tx, 0, new_value)
}

pub fn remove_mint_from_context(tx: Transaction) {
  Transaction { ..tx, mint: assets.zero }
}

pub fn change_script_output_datum(tx: Transaction, datum: GithoneyDatum) {
  expect Some(output) = head(tx.outputs)
  let outputs = option.or_else(tail(tx.outputs), [])
  let outputs = outputs |> push(Output { ..output, datum: InlineDatum(datum) })
  Transaction { ..tx, outputs: outputs }
}

pub fn change_script_input_datum(tx: Transaction, datum: GithoneyDatum) {
  expect Some(input) = head(tx.inputs)
  let inputs = option.or_else(tail(tx.inputs), [])
  let inputs =
    inputs
      |> push(
          Input {
            ..input,
            output: Output { ..input.output, datum: InlineDatum(datum) },
          },
        )
  Transaction { ..tx, inputs: inputs }
}

pub fn change_script_upper_bound(tx: Transaction, upper_bound: Int) {
  Transaction {
    ..tx,
    validity_range: Interval {
      ..tx.validity_range,
      upper_bound: IntervalBound {
        bound_type: Finite(upper_bound),
        is_inclusive: True,
      },
    },
  }
}

pub fn tx_builder(
  inputs: List<Input>,
  outputs: List<Output>,
  value_to_mint: Value,
  redeemers: Pairs<ScriptPurpose, Redeemer>,
  datums: Dict<DataHash, Data>,
  transaction_id: ByteArray,
) {
  Transaction {
    inputs,
    reference_inputs: [mocks.mk_settings_input()],
    outputs,
    fee: 2_000_000,
    mint: value_to_mint,
    certificates: [],
    withdrawals: [],
    validity_range: Interval {
      lower_bound: IntervalBound { bound_type: Finite(0), is_inclusive: True },
      upper_bound: IntervalBound {
        bound_type: Finite(1716260400),
        is_inclusive: True,
      },
    },
    extra_signatories: [],
    redeemers,
    datums,
    id: transaction_id,
    votes: [],
    proposal_procedures: [],
    current_treasury_amount: None,
    treasury_donation: None,
  }
}

pub fn mk_mp_transaction() {
  let maintainer_input_utxo =
    input_with_assets(
      mocks.transaction_id,
      1,
      mocks.mk_maintainer_address(),
      assets.from_lovelace(40_000_000)
        |> assets.add(mocks.token_a_policy, mocks.token_a_name, 10_000),
    )

  let value =
    assets.from_lovelace(mocks.mk_settings_datum().bounty_creation_fee)
  let out_githoney_address =
    Output {
      address: mocks.mk_githoney_address(),
      value,
      datum: mocks.mk_script_datum(value),
      reference_script: None,
    }

  tx_builder(
    [maintainer_input_utxo],
    [mocks.mk_output_bounty_utxo(), out_githoney_address],
    assets.from_asset(mocks.bounty_id_policy, mocks.bounty_id_name, 1),
    [],
    dict.empty,
    mocks.transaction_id_3,
  )
}

pub fn mk_transition_transaction(redeemer: Redeemer) {
  let rewards_input =
    input_with_assets(
      mocks.transaction_id,
      1,
      mocks.mk_maintainer_address(),
      assets.from_lovelace(4_000_000)
        |> assets.add(mocks.token_b_policy, mocks.token_b_name, 10_000),
    )
  let purpose = Spend(mocks.script_out_ref())
  tx_builder(
    [mocks.mk_input_bounty_utxo(), rewards_input],
    [mocks.mk_output_bounty_utxo()],
    assets.zero,
    [Pair(purpose, redeemer)],
    dict.empty,
    mocks.transaction_id_3,
  )
}

pub fn mk_burn_transaction(redeemer: Redeemer) {
  let rewards_input =
    input_with_assets(
      mocks.transaction_id,
      1,
      mocks.mk_admin_address(),
      assets.from_lovelace(4_000_000)
        |> assets.add(mocks.token_b_policy, mocks.token_b_name, 10_000),
    )
  let purpose = Spend(mocks.script_out_ref())
  tx_builder(
    [mocks.mk_input_bounty_utxo(), rewards_input],
    [],
    assets.from_asset(mocks.bounty_id_policy, mocks.bounty_id_name, -1),
    [Pair(purpose, redeemer)],
    dict.empty,
    mocks.transaction_id_3,
  )
}

pub fn mk_settings_transaction(redeemer: Redeemer) {
  let purpose = Spend(mocks.mk_settings_out_ref())
  tx_builder(
    [mocks.mk_settings_input()],
    [],
    assets.zero,
    [Pair(purpose, redeemer)],
    dict.empty,
    mocks.transaction_id_3,
  )
}

pub fn mk_mp_settings_transaction() {
  let githoney_input_utxo =
    input_with_assets(
      mocks.transaction_id_2,
      0,
      mocks.mk_githoney_address(),
      assets.from_lovelace(40_000_000),
    )
  tx_builder(
    [githoney_input_utxo],
    [mocks.mk_settings_output()],
    assets.from_asset(mocks.settings_nft_policy, mocks.settings_token_name, 1),
    [],
    dict.empty,
    mocks.transaction_id_3,
  )
}
