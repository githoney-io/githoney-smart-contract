use aiken/dict
use aiken/interval.{Finite, Interval, IntervalBound, PositiveInfinity}
use aiken/transaction.{
  InlineDatum, Input, Mint, NoDatum, Output, OutputReference, ScriptContext,
  Transaction, TransactionId,
}
use aiken/transaction/credential.{Address, ScriptCredential}
use aiken/transaction/value
use types.{GithoneyContractRedeemers, GithoneyDatum, GithoneyFee}
use mocks

pub fn mk_mp_script_context() -> ScriptContext {
  let user_addr =
    Address {
      payment_credential: ScriptCredential(mocks.user_addr),
      stake_credential: None,
    }

  let manager_input_utxo =
    Input {
      output_reference: OutputReference {
        transaction_id: TransactionId { hash: mocks.transaction_id },
        output_index: 1,
      },
      output: Output {
        address: user_addr,
        value: value.from_lovelace(4_000_000),
        datum: NoDatum,
        reference_script: None,
      },
    }

  let githoney_address =
    Address {
      payment_credential: ScriptCredential(mocks.githoney_addr),
      stake_credential: None,
    }

  let bounty_utxo =
    Output {
      address: githoney_address,
      value: value.from_lovelace(2_000_000)
        |> value.add(mocks.control_token_policy, mocks.control_token_name, 1),
      datum: InlineDatum(
        GithoneyDatum {
        admin_wallet: ,
        maintainer_wallet: ,
        contributor_wallet: ,
        bounty_id: ,
        deadline: ,
        merged:
        },
      ),
      reference_script: None,
    }

  let scr_ctx =
    ScriptContext {
      purpose: Mint(mocks.control_token_policy),
      transaction: Transaction {
        inputs: [manager_input_utxo],
        reference_inputs: [],
        outputs: [bounty_utxo],
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
