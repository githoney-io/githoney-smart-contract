use aiken/dict.{Dict}
use aiken/interval.{Finite, Interval, IntervalBound}
use aiken/hash.{Blake2b_256, Hash}
use aiken/transaction.{
  Input, Mint, Spend, NoDatum, Output, OutputReference, ScriptContext, Transaction,
  TransactionId, ScriptPurpose, Redeemer
}
use aiken/transaction/credential.{Address}
use aiken/transaction/value.{Value}
use aiken/bytearray
use aiken/list.{span, at, concat, tail, push}
use mocks

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
    Spend(ref) -> ref.transaction_id.hash
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

pub fn input_with_assets(transaction_id: ByteArray, output_index: Int, address: Address, value: Value) -> Input {
  Input {
    output_reference: OutputReference {
      transaction_id: TransactionId {hash: transaction_id},
      output_index: output_index,
    },
    output: Output {
      address: address,
      value: value,
      datum: NoDatum,
      reference_script: None,
    },
  }
}

pub fn change_output_value(ctx: ScriptContext, index: Int, new_value: Value) -> ScriptContext {
  expect Some(output) = at(ctx.transaction.outputs, index)
  let output =
    Output {
      ..output,
      value: new_value
    }
  let (out1, out2) = span(ctx.transaction.outputs, index)
  expect Some(out2) = tail(out2)
  let out2 = out2 |> push(output)
  ScriptContext {
    ..ctx,
    transaction: Transaction {..ctx.transaction, outputs: concat(out1, out2)}
  }
}

pub fn tx_builder(inputs: List<Input>,
  outputs: List<Output>,
  value_to_mint: Value,
  redeemers: Dict<ScriptPurpose, Redeemer>,
  datums: Dict<Hash<Blake2b_256, Data>,Data>,
  transaction_id: ByteArray) -> Transaction {
    Transaction {
      inputs: inputs,
      reference_inputs: [],
      outputs: outputs,
      fee: value.from_lovelace(2_000_000),
      mint: value.to_minted_value(value_to_mint),
      certificates: [],
      withdrawals: dict.new(),
      validity_range: Interval {
        lower_bound: IntervalBound {
          bound_type: Finite(0),
          is_inclusive: True,
        },
        upper_bound: IntervalBound {
          bound_type: Finite(1716260400),
          is_inclusive: True,
        },
      },
      extra_signatories: [],
      redeemers: redeemers,
      datums: datums,
      id: TransactionId { hash: transaction_id },
    }
}

pub fn mk_mp_script_context() -> ScriptContext {
  let maintainer_input_utxo = input_with_assets(
    mocks.transaction_id,
    1,
    mocks.mk_maintainer_address(),
    value.from_lovelace(40_000_000)
      |> value.add(mocks.token_a_policy, mocks.token_a_name, 10_000),
  )

  let out_githoney_wallet =
    Output {
      address: mocks.mk_githoney_address(),
      value: value.from_lovelace(mocks.mk_githoney_fee().bounty_creation_fee),
      datum: NoDatum,
      reference_script: None,
    }

  ScriptContext {
    purpose: Mint(mocks.control_token_policy),
    transaction: tx_builder(
      [maintainer_input_utxo],
      [mocks.mk_output_bounty_utxo(), out_githoney_wallet],
      value.from_asset(
          mocks.control_token_policy,
          mocks.control_token_name,
          1,
        ),
      dict.new(),
      dict.new(),
      mocks.transaction_id_3
    )
  }
}

pub fn mk_transition_script_context(redeemer: Redeemer) -> ScriptContext {
  let rewards_input = input_with_assets(
    mocks.transaction_id,
    1,
    mocks.mk_maintainer_address(),
    value.from_lovelace(4_000_000)
      |> value.add(mocks.token_b_policy, mocks.token_b_name, 10_000),
  )
  let purpose = Spend(mocks.script_out_ref())
  ScriptContext {
    purpose: purpose,
    transaction: tx_builder(
      [mocks.mk_input_bounty_utxo(), rewards_input],
      [mocks.mk_output_bounty_utxo()],
      value.zero(),
      dict.new()
        |> dict.insert(purpose, redeemer, script_purpose_compare),
      dict.new(),
      mocks.transaction_id_3
    )
  }
}