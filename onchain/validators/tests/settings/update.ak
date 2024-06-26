use aiken/list.{head}
use aiken/transaction.{InlineDatum, NoDatum, Output, ScriptContext, Transaction}
use aiken/transaction/value
use mocks
use test_utils.{
  add_extra_signature, add_output, change_input_value,
  mk_settings_script_context, script_input_without_settings_nft,
}
use types.{SettingsDatum, UpdateSettings}
use utils.{to_settings_datum}
use validations.{update_settings}

test success() {
  let ctx = mk_settings_script_context(UpdateSettings)
  expect Some(script_input) = head(ctx.transaction.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)
  let new_datum = SettingsDatum { ..datum, bounty_reward_fee: 3000 }

  let output =
    Output { ..mocks.mk_settings_output(), datum: InlineDatum(new_datum) }
  let script_ctx =
    ctx
      |> add_output(output)
      |> add_extra_signature(mocks.githoney_addr)

  update_settings(datum, script_ctx)
}

test without_githoney_signature() {
  let ctx = mk_settings_script_context(UpdateSettings)
  expect Some(script_input) = head(ctx.transaction.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let output = mocks.mk_settings_output()
  let script_ctx =
    ctx
      |> add_output(output)

  !update_settings(datum, script_ctx)
}

test more_than_one_token_input() {
  let ctx = mk_settings_script_context(UpdateSettings)
  expect Some(script_input) = head(ctx.transaction.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let new_value =
    value.merge(
      script_input.output.value,
      value.from_asset(
        mocks.settings_nft_policy,
        mocks.settings_token_name,
        123,
      ),
    )
  let new_ctx = change_input_value(ctx, 0, new_value)

  let output = mocks.mk_settings_output()
  let script_ctx =
    new_ctx
      |> add_output(output)
      |> add_extra_signature(mocks.githoney_addr)

  !update_settings(datum, script_ctx)
}

test without_settings_token_in_input() fail {
  let ctx = mk_settings_script_context(UpdateSettings)
  expect Some(script_input) = head(ctx.transaction.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let output = mocks.mk_settings_output()
  let script_ctx =
    ctx
      |> add_output(output)
      |> add_extra_signature(mocks.githoney_addr)
      |> script_input_without_settings_nft()

  update_settings(datum, script_ctx)
}

test without_settings_token_in_output() {
  let ctx = mk_settings_script_context(UpdateSettings)
  expect Some(script_input) = head(ctx.transaction.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let wrong_output =
    Output { ..mocks.mk_settings_output(), value: value.zero() }

  let script_ctx =
    ctx
      |> add_output(wrong_output)
      |> add_extra_signature(mocks.githoney_addr)

  !update_settings(datum, script_ctx)
}

test bad_new_datum() fail {
  let ctx = mk_settings_script_context(UpdateSettings)
  expect Some(script_input) = head(ctx.transaction.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let output = Output { ..mocks.mk_settings_output(), datum: NoDatum }
  let script_ctx =
    ctx
      |> add_output(output)
      |> add_extra_signature(mocks.githoney_addr)

  update_settings(datum, script_ctx)
}

test bad_pay_address() {
  let ctx = mk_settings_script_context(UpdateSettings)
  expect Some(script_input) = head(ctx.transaction.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let output =
    Output { ..mocks.mk_settings_output(), address: mocks.mk_admin_address() }
  let script_ctx =
    ctx
      |> add_output(output)
      |> add_extra_signature(mocks.githoney_addr)

  !update_settings(datum, script_ctx)
}
