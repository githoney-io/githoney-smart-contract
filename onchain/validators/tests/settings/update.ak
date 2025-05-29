use aiken/collection/list.{head}
use cardano/assets
use cardano/transaction.{InlineDatum, NoDatum, Output, Transaction}
use githoney_contract
use mocks
use test_utils.{
  add_extra_signature, add_output, change_input_value, mk_settings_transaction,
  script_input_without_settings_nft,
}
use types.{SettingsDatum, UpdateSettings}
use utils.{to_settings_datum}

test success() {
  let ctx = mk_settings_transaction(UpdateSettings)
  expect Some(script_input) = head(ctx.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)
  let new_datum = SettingsDatum { ..datum, bounty_reward_fee: 3000 }

  let output =
    Output { ..mocks.mk_settings_output(), datum: InlineDatum(new_datum) }
  let tx =
    ctx
      |> add_output(output)
      |> add_extra_signature(mocks.githoney_addr)

  githoney_contract.settings.spend(
    Some(datum),
    UpdateSettings,
    script_input.output_reference,
    tx,
  )
}

test without_githoney_signature() {
  let ctx = mk_settings_transaction(UpdateSettings)
  expect Some(script_input) = head(ctx.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let output = mocks.mk_settings_output()
  let tx =
    ctx
      |> add_output(output)

  !githoney_contract.settings.spend(
    Some(datum),
    UpdateSettings,
    script_input.output_reference,
    tx,
  )
}

test more_than_one_token_input() fail {
  let ctx = mk_settings_transaction(UpdateSettings)
  expect Some(script_input) = head(ctx.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let new_value =
    assets.merge(
      script_input.output.value,
      assets.from_asset(
        mocks.settings_nft_policy,
        mocks.settings_token_name,
        123,
      ),
    )
  let new_ctx = change_input_value(ctx, 0, new_value)

  let output = mocks.mk_settings_output()
  let tx =
    new_ctx
      |> add_output(output)
      |> add_extra_signature(mocks.githoney_addr)

  !githoney_contract.settings.spend(
    Some(datum),
    UpdateSettings,
    script_input.output_reference,
    tx,
  )
}

test without_settings_token_in_input() fail {
  let ctx = mk_settings_transaction(UpdateSettings)
  expect Some(script_input) = head(ctx.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let output = mocks.mk_settings_output()
  let tx =
    ctx
      |> add_output(output)
      |> add_extra_signature(mocks.githoney_addr)
      |> script_input_without_settings_nft()

  githoney_contract.settings.spend(
    Some(datum),
    UpdateSettings,
    script_input.output_reference,
    tx,
  )
}

test without_settings_token_in_output() fail {
  let ctx = mk_settings_transaction(UpdateSettings)
  expect Some(script_input) = head(ctx.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let wrong_output = Output { ..mocks.mk_settings_output(), value: assets.zero }

  let tx =
    ctx
      |> add_output(wrong_output)
      |> add_extra_signature(mocks.githoney_addr)

  !githoney_contract.settings.spend(
    Some(datum),
    UpdateSettings,
    script_input.output_reference,
    tx,
  )
}

test bad_new_datum() fail {
  let ctx = mk_settings_transaction(UpdateSettings)
  expect Some(script_input) = head(ctx.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let output = Output { ..mocks.mk_settings_output(), datum: NoDatum }
  let tx =
    ctx
      |> add_output(output)
      |> add_extra_signature(mocks.githoney_addr)

  githoney_contract.settings.spend(
    Some(datum),
    UpdateSettings,
    script_input.output_reference,
    tx,
  )
}

test bad_pay_address() fail {
  let ctx = mk_settings_transaction(UpdateSettings)
  expect Some(script_input) = head(ctx.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let output =
    Output { ..mocks.mk_settings_output(), address: mocks.mk_admin_address() }
  let tx =
    ctx
      |> add_output(output)
      |> add_extra_signature(mocks.githoney_addr)

  !githoney_contract.settings.spend(
    Some(datum),
    UpdateSettings,
    script_input.output_reference,
    tx,
  )
}
