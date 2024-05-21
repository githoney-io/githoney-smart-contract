use aiken/dict
use aiken/interval.{Finite, Interval, IntervalBound, PositiveInfinity}
use aiken/transaction.{
  InlineDatum, Input, Mint, NoDatum, Output, OutputReference, ScriptContext,
  Transaction, TransactionId,
}
use aiken/transaction/credential.{ScriptCredential}
use aiken/transaction/value
use mocks
use types.{GithoneyDatum, Wallet}

pub fn mk_mp_script_context() -> ScriptContext {
  let maintainer_input_utxo =
    Input {
      output_reference: OutputReference {
        transaction_id: TransactionId { hash: mocks.transaction_id },
        output_index: 1,
      },
      output: Output {
        address: mocks.mk_maintainer_address(),
        value: value.from_lovelace(4_000_000)
          |> value.add(mocks.token_a_policy, mocks.token_a_name, 10_000),
        datum: NoDatum,
        reference_script: None,
      },
    }

  let bounty_utxo = mocks.mk_output_bounty_utxo()

  let out_githoney_wallet =
    Output {
      address: mocks.mk_githoney_address(),
      value: value.from_lovelace(mocks.mk_githoney_fee().bounty_creation_fee),
      datum: NoDatum,
      reference_script: None,
    }

  let scr_ctx =
    ScriptContext {
      purpose: Mint(mocks.control_token_policy),
      transaction: Transaction {
        inputs: [maintainer_input_utxo],
        reference_inputs: [],
        outputs: [bounty_utxo, out_githoney_wallet],
        fee: value.from_lovelace(2_000_000),
        mint: value.to_minted_value(
          value.from_asset(
            mocks.control_token_policy,
            mocks.control_token_name,
            1,
          ),
        ),
        certificates: [],
        withdrawals: dict.new(),
        validity_range: Interval {
          lower_bound: IntervalBound {
            bound_type: Finite(0),
            is_inclusive: True,
          },
          upper_bound: IntervalBound {
            bound_type: PositiveInfinity,
            is_inclusive: False,
          },
        },
        extra_signatories: [],
        redeemers: dict.new(),
        datums: dict.new(),
        id: TransactionId { hash: mocks.transaction_id_3 },
      },
    }
  scr_ctx
}
