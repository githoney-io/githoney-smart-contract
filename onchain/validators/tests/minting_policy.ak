use aiken/list
use aiken/transaction.{NoDatum, Output, ScriptContext, Transaction}
use aiken/transaction/credential.{Address, ScriptCredential}
use aiken/transaction/value
use mocks
use test_utils
use utils.{min_ada}
use validations.{minting_policy}

test general_test() {
  let ctx = test_utils.mk_mp_script_context()

  minting_policy(mocks.mk_githoney_fee(), ctx)
}

test wrong_datum() fail {
  let ctx = test_utils.mk_mp_script_context()

  expect Some(bounty_utxo) = list.head(ctx.transaction.outputs)
  let wrong_output = Output { ..bounty_utxo, datum: NoDatum }

  let wrong_ctx =
    ScriptContext {
      ..ctx,
      transaction: Transaction { ..ctx.transaction, outputs: [wrong_output] },
    }

  minting_policy(mocks.mk_githoney_fee(), wrong_ctx)
}

test fee_not_paid() {
  let ctx = test_utils.mk_mp_script_context()

  expect Some(outputs) = list.tail(ctx.transaction.outputs)
  let wrong_bounty = {
    expect Some(bounty_utxo) = list.head(ctx.transaction.outputs)
    Output {
      ..bounty_utxo,
      value: value.from_lovelace(min_ada)
        |> value.add(mocks.control_token_policy, mocks.control_token_name, 1),
    }
  }
  let wrong_ctx =
    ScriptContext {
      ..ctx,
      transaction: Transaction {
        ..ctx.transaction,
        outputs: list.push(outputs, wrong_bounty),
      },
    }
  !minting_policy(mocks.mk_githoney_fee(), wrong_ctx)
}

test wrong_value() {
  let ctx = test_utils.mk_mp_script_context()

  expect Some(outputs) = list.tail(ctx.transaction.outputs)
  let wrong_bounty = {
    expect Some(bounty_utxo) = list.head(ctx.transaction.outputs)
    Output { ..bounty_utxo, value: value.from_lovelace(1_234_567) }
  }
  let wrong_ctx =
    ScriptContext {
      ..ctx,
      transaction: Transaction {
        ..ctx.transaction,
        outputs: list.push(outputs, wrong_bounty),
      },
    }

  !minting_policy(mocks.mk_githoney_fee(), wrong_ctx)
}

test wrong_minted_amount() fail {
  let ctx = test_utils.mk_mp_script_context()

  let wrong_ctx =
    ScriptContext {
      ..ctx,
      transaction: Transaction {
        ..ctx.transaction,
        mint: value.to_minted_value(
          value.from_asset(
            mocks.control_token_policy,
            mocks.control_token_name,
            1,
          )
            |> value.add("123456789", "other_token", 1),
        ),
      },
    }
  minting_policy(mocks.mk_githoney_fee(), wrong_ctx)
}

test wrong_burned_amount() {
  let ctx = test_utils.mk_mp_script_context()

  let wrong_ctx =
    ScriptContext {
      ..ctx,
      transaction: Transaction {
        ..ctx.transaction,
        mint: value.to_minted_value(
          value.from_asset(
            mocks.control_token_policy,
            mocks.control_token_name,
            -1234,
          ),
        ),
      },
    }
  !minting_policy(mocks.mk_githoney_fee(), wrong_ctx)
}

test invalid_script_output_address() {
  let ctx = test_utils.mk_mp_script_context()

  expect Some(outputs) = list.tail(ctx.transaction.outputs)
  let wrong_bounty = {
    expect Some(bounty_utxo) = list.head(ctx.transaction.outputs)
    Output {
      ..bounty_utxo,
      address: Address {
        payment_credential: ScriptCredential("addr_test"),
        stake_credential: None,
      },
    }
  }
  let wrong_ctx =
    ScriptContext {
      ..ctx,
      transaction: Transaction {
        ..ctx.transaction,
        outputs: list.push(outputs, wrong_bounty),
      },
    }
  !minting_policy(mocks.mk_githoney_fee(), wrong_ctx)
}
