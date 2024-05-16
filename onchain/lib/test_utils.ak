use aiken/dict
use aiken/interval.{Finite, Interval, IntervalBound, PositiveInfinity}
use aiken/transaction.{
  InlineDatum, Input, Mint, NoDatum, Output, OutputReference, ScriptContext,
  Transaction, TransactionId,
}
use aiken/transaction/credential.{Address, ScriptCredential}
use aiken/transaction/value
use mocks
use types.{
  GithoneyContractRedeemers, GithoneyDatum, GithoneyFee, VerificationKeyHash,
  Wallet,
}

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

  let admin_wallet =
    Wallet {
      payment_key: VerificationKeyHash(mocks.admin_addr),
      stake_key: None,
    }

  let maintainer_wallet =
    Wallet {
      payment_key: VerificationKeyHash(mocks.maintainer_addr),
      stake_key: None,
    }

  let contributor_wallet =
    Wallet {
      payment_key: VerificationKeyHash(mocks.contributor_addr),
      stake_key: None,
    }

  let bounty_utxo =
    Output {
      address: githoney_address,
      value: value.from_lovelace(2_000_000)
        |> value.add(mocks.control_token_policy, mocks.control_token_name, 1),
      datum: InlineDatum(
        GithoneyDatum {
          admin_wallet,
          maintainer_wallet,
          contributor_wallet,
          bounty_id: mocks.bounty_id,
          deadline: 1715888789 + 604800,
          // 23 of May
          merged: False,
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
