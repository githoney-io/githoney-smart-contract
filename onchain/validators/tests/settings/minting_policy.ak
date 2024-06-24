use aiken/list
use aiken/transaction.{NoDatum, Output, ScriptContext, Transaction}
use aiken/transaction/value
use mocks
use test_utils
use validations.{minting_policy_settings}

test success() {
  let ctx = test_utils.mk_mp_settings_script_context()

  minting_policy_settings(mocks.mk_settings_out_ref(), ctx)
}

test wrong_datum() fail {
  let ctx = test_utils.mk_mp_settings_script_context()

  expect Some(settings_utxo) = list.head(ctx.transaction.outputs)
  let wrong_output = Output { ..settings_utxo, datum: NoDatum }

  let wrong_ctx =
    ScriptContext {
      ..ctx,
      transaction: Transaction { ..ctx.transaction, outputs: [wrong_output] },
    }

  minting_policy_settings(mocks.mk_settings_out_ref(), wrong_ctx)
}

test wrong_minted_amount() fail {
  let ctx = test_utils.mk_mp_settings_script_context()

  let wrong_ctx =
    ScriptContext {
      ..ctx,
      transaction: Transaction {
        ..ctx.transaction,
        mint: value.to_minted_value(
          value.from_asset(
            mocks.settings_nft_policy,
            mocks.settings_token_name,
            1,
          )
            |> value.add("123456789", "other_token", 1),
        ),
      },
    }
  minting_policy_settings(mocks.mk_settings_out_ref(), wrong_ctx)
}

test wrong_burned_amount() {
  let ctx = test_utils.mk_mp_settings_script_context()

  let wrong_ctx =
    ScriptContext {
      ..ctx,
      transaction: Transaction {
        ..ctx.transaction,
        mint: value.to_minted_value(
          value.from_asset(
            mocks.settings_nft_policy,
            mocks.settings_token_name,
            -1234,
          ),
        ),
      },
    }
  !minting_policy_settings(mocks.mk_settings_out_ref(), wrong_ctx)
}

test utxo_not_present_in_inputs() {
  let ctx = test_utils.mk_mp_settings_script_context()

  let wrong_ctx =
    ScriptContext {
      ..ctx,
      transaction: Transaction { ..ctx.transaction, inputs: [] },
    }
  !minting_policy_settings(mocks.mk_settings_out_ref(), wrong_ctx)
}

test without_settings_token_in_output() {
  let ctx = test_utils.mk_mp_settings_script_context()

  let wrong_output =
    Output { ..mocks.mk_settings_output(), value: value.zero() }

  let wrong_ctx =
    ScriptContext {
      ..ctx,
      transaction: Transaction { ..ctx.transaction, outputs: [wrong_output] },
    }
  !minting_policy_settings(mocks.mk_settings_out_ref(), wrong_ctx)
}
