use aiken/list.{head}
use aiken/transaction.{NoDatum, Output, ScriptContext, Transaction}
use aiken/transaction/value
use mocks
use test_utils.{
  add_extra_signature, add_output, mk_settings_script_context,
  script_input_without_settings_nft,
}
use types.{CloseSettings, SettingsDatum}
use utils.{to_settings_datum}
use validations.{close_settings}

fn close_ctx() -> ScriptContext {
  let ctx_without_value = mk_settings_script_context(CloseSettings)
  ScriptContext {
    ..ctx_without_value,
    transaction: Transaction {
      ..ctx_without_value.transaction,
      mint: value.to_minted_value(
        value.from_asset(
          mocks.settings_nft_policy,
          mocks.settings_token_name,
          -1,
        ),
      ),
    },
  }
}

test success() {
  let ctx = close_ctx()
  expect Some(script_input) = head(ctx.transaction.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let output =
    Output {
      address: mocks.mk_githoney_address(),
      value: script_input.output.value
        |> value.add(mocks.settings_nft_policy, mocks.settings_token_name, -1),
      datum: NoDatum,
      reference_script: None,
    }
  let script_ctx =
    ctx
      |> add_output(output)
      |> add_extra_signature(mocks.githoney_addr)

  close_settings(datum, script_ctx)
}

test without_githoney_signature() {
  let ctx = close_ctx()
  expect Some(script_input) = head(ctx.transaction.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let output =
    Output {
      address: mocks.mk_githoney_address(),
      value: script_input.output.value
        |> value.add(mocks.settings_nft_policy, mocks.settings_token_name, -1),
      datum: NoDatum,
      reference_script: None,
    }
  let script_ctx =
    ctx
      |> add_output(output)

  !close_settings(datum, script_ctx)
}

test githoney_bad_pay() {
  let ctx = close_ctx()
  expect Some(script_input) = head(ctx.transaction.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let output =
    Output {
      address: mocks.mk_githoney_address(),
      value: value.zero(),
      datum: NoDatum,
      reference_script: None,
    }
  let script_ctx =
    ctx
      |> add_output(output)
      |> add_extra_signature(mocks.githoney_addr)

  !close_settings(datum, script_ctx)
}

test without_settings_token_input() fail {
  let ctx = close_ctx()
  expect Some(script_input) = head(ctx.transaction.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let output =
    Output {
      address: mocks.mk_githoney_address(),
      value: script_input.output.value
        |> value.add(mocks.settings_nft_policy, mocks.settings_token_name, -1),
      datum: NoDatum,
      reference_script: None,
    }
  let script_ctx =
    ctx
      |> add_output(output)
      |> add_extra_signature(mocks.githoney_addr)
      |> script_input_without_settings_nft()

  close_settings(datum, script_ctx)
}

test without_settings_token_burn() {
  let ctx_without_value = mk_settings_script_context(CloseSettings)
  let ctx =
    ScriptContext {
      ..ctx_without_value,
      transaction: Transaction {
        ..ctx_without_value.transaction,
        mint: value.to_minted_value(
          value.from_asset(
            mocks.settings_nft_policy,
            mocks.settings_token_name,
            1,
          ),
        ),
      },
    }
  expect Some(script_input) = head(ctx.transaction.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let output =
    Output {
      address: mocks.mk_githoney_address(),
      value: script_input.output.value
        |> value.add(mocks.settings_nft_policy, mocks.settings_token_name, -1),
      datum: NoDatum,
      reference_script: None,
    }
  let script_ctx =
    ctx
      |> add_output(output)
      |> add_extra_signature(mocks.githoney_addr)

  !close_settings(datum, script_ctx)
}
