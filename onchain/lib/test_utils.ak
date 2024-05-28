use aiken/bytearray
use aiken/dict.{Dict}
use aiken/hash.{Blake2b_256, Hash}
use aiken/interval.{Finite, Interval, IntervalBound}
use aiken/list.{at, concat, head, push, span, tail}
use aiken/option
use aiken/transaction.{
  InlineDatum, Input, Mint, NoDatum, Output, OutputReference, Redeemer,
  ScriptContext, ScriptPurpose, Spend, Transaction, TransactionId,
}
use aiken/transaction/credential.{Address}
use aiken/transaction/value.{Value}
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

pub fn add_extra_signature(
  ctx: ScriptContext,
  signature: ByteArray,
) -> ScriptContext {
  ScriptContext {
    ..ctx,
    transaction: Transaction {
      ..ctx.transaction,
      extra_signatories: ctx.transaction.extra_signatories |> push(signature),
    },
  }
}

pub fn add_output(ctx: ScriptContext, output: Output) -> ScriptContext {
  ScriptContext {
    ..ctx,
    transaction: Transaction {
      ..ctx.transaction,
      outputs: concat(ctx.transaction.outputs, [output]),
    },
  }
}

pub fn input_with_assets(
  transaction_id: ByteArray,
  output_index: Int,
  address: Address,
  value: Value,
) -> Input {
  Input {
    output_reference: OutputReference {
      transaction_id: TransactionId { hash: transaction_id },
      output_index,
    },
    output: Output { address, value, datum: NoDatum, reference_script: None },
  }
}

pub fn change_output_value(
  ctx: ScriptContext,
  index: Int,
  new_value: Value,
) -> ScriptContext {
  expect Some(output) = at(ctx.transaction.outputs, index)
  let output = Output { ..output, value: new_value }
  let (out1, out2) = span(ctx.transaction.outputs, index)
  expect Some(out2) = tail(out2)
  let out2 = out2 |> push(output)
  ScriptContext {
    ..ctx,
    transaction: Transaction { ..ctx.transaction, outputs: concat(out1, out2) },
  }
}

pub fn change_output_address(
  ctx: ScriptContext,
  index: Int,
  new_address: Address,
) -> ScriptContext {
  expect Some(output) = at(ctx.transaction.outputs, index)
  let output = Output { ..output, address: new_address }
  let (out1, out2) = span(ctx.transaction.outputs, index)
  expect Some(out2) = tail(out2)
  let out2 = out2 |> push(output)
  ScriptContext {
    ..ctx,
    transaction: Transaction { ..ctx.transaction, outputs: concat(out1, out2) },
  }
}

pub fn change_input_value(
  ctx: ScriptContext,
  index: Int,
  new_value: Value,
) -> ScriptContext {
  expect Some(input) = at(ctx.transaction.inputs, index)
  let input =
    Input { ..input, output: Output { ..input.output, value: new_value } }
  let (inp1, inp2) = span(ctx.transaction.inputs, index)
  expect Some(inp2) = tail(inp2)
  let inp2 = inp2 |> push(input)
  ScriptContext {
    ..ctx,
    transaction: Transaction { ..ctx.transaction, inputs: concat(inp1, inp2) },
  }
}

pub fn script_input_without_control_token(ctx: ScriptContext) -> ScriptContext {
  expect Some(script_input) = head(ctx.transaction.inputs)
  let new_value =
    value.merge(
      script_input.output.value,
      value.from_asset(mocks.control_token_policy, mocks.control_token_name, -1),
    )
  change_input_value(ctx, 0, new_value)
}

pub fn change_script_output_datum(
  ctx: ScriptContext,
  datum: GithoneyDatum,
) -> ScriptContext {
  expect Some(output) = head(ctx.transaction.outputs)
  let outputs = option.or_else(tail(ctx.transaction.outputs), [])
  let outputs = outputs |> push(Output { ..output, datum: InlineDatum(datum) })
  ScriptContext {
    ..ctx,
    transaction: Transaction { ..ctx.transaction, outputs: outputs },
  }
}

pub fn change_script_input_datum(
  ctx: ScriptContext,
  datum: GithoneyDatum,
) -> ScriptContext {
  expect Some(input) = head(ctx.transaction.inputs)
  let inputs = option.or_else(tail(ctx.transaction.inputs), [])
  let inputs =
    inputs
      |> push(
           Input {
             ..input,
             output: Output { ..input.output, datum: InlineDatum(datum) },
           },
         )
  ScriptContext {
    ..ctx,
    transaction: Transaction { ..ctx.transaction, inputs: inputs },
  }
}

pub fn change_script_upper_bound(
  ctx: ScriptContext,
  upper_bound: Int,
) -> ScriptContext {
  ScriptContext {
    ..ctx,
    transaction: Transaction {
      ..ctx.transaction,
      validity_range: Interval {
        ..ctx.transaction.validity_range,
        upper_bound: IntervalBound {
          bound_type: Finite(upper_bound),
          is_inclusive: True,
        },
      },
    },
  }
}

pub fn tx_builder(
  inputs: List<Input>,
  outputs: List<Output>,
  value_to_mint: Value,
  redeemers: Dict<ScriptPurpose, Redeemer>,
  datums: Dict<Hash<Blake2b_256, Data>, Data>,
  transaction_id: ByteArray,
) -> Transaction {
  Transaction {
    inputs,
    reference_inputs: [],
    outputs,
    fee: value.from_lovelace(2_000_000),
    mint: value.to_minted_value(value_to_mint),
    certificates: [],
    withdrawals: dict.new(),
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
    id: TransactionId { hash: transaction_id },
  }
}

pub fn mk_mp_script_context() -> ScriptContext {
  let maintainer_input_utxo =
    input_with_assets(
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
      value.from_asset(mocks.control_token_policy, mocks.control_token_name, 1),
      dict.new(),
      dict.new(),
      mocks.transaction_id_3,
    ),
  }
}

pub fn mk_transition_script_context(redeemer: Redeemer) -> ScriptContext {
  let rewards_input =
    input_with_assets(
      mocks.transaction_id,
      1,
      mocks.mk_maintainer_address(),
      value.from_lovelace(4_000_000)
        |> value.add(mocks.token_b_policy, mocks.token_b_name, 10_000),
    )
  let purpose = Spend(mocks.script_out_ref())
  ScriptContext {
    purpose,
    transaction: tx_builder(
      [mocks.mk_input_bounty_utxo(), rewards_input],
      [mocks.mk_output_bounty_utxo()],
      value.zero(),
      dict.new()
        |> dict.insert(purpose, redeemer, script_purpose_compare),
      dict.new(),
      mocks.transaction_id_3,
    ),
  }
}

pub fn mk_burn_script_context(redeemer: Redeemer) -> ScriptContext {
  let rewards_input =
    input_with_assets(
      mocks.transaction_id,
      1,
      mocks.mk_admin_address(),
      value.from_lovelace(4_000_000)
        |> value.add(mocks.token_b_policy, mocks.token_b_name, 10_000),
    )
  let purpose = Spend(mocks.script_out_ref())
  ScriptContext {
    purpose,
    transaction: tx_builder(
      [mocks.mk_input_bounty_utxo(), rewards_input],
      [],
      value.from_asset(mocks.control_token_policy, mocks.control_token_name, -1),
      dict.new()
        |> dict.insert(purpose, redeemer, script_purpose_compare),
      dict.new(),
      mocks.transaction_id_3,
    ),
  }
}
