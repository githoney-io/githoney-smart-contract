use aiken/collection/list.{head}
use cardano/assets
use cardano/transaction.{NoDatum, Output, Transaction}
use githoney_contract
use mocks
use test_utils.{
  add_extra_signature, add_output, mk_settings_transaction,
  script_input_without_settings_nft,
}
use types.{CloseSettings, SettingsDatum}
use utils.{to_settings_datum}

fn close_tx() -> Transaction {
  let tx_without_value = mk_settings_transaction(CloseSettings)
  Transaction {
    ..tx_without_value,
    mint: assets.from_asset(
      mocks.settings_nft_policy,
      mocks.settings_token_name,
      -1,
    ),
  }
}

test success() {
  let tx = close_tx()
  expect Some(script_input) = head(tx.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let output =
    Output {
      address: mocks.mk_githoney_address(),
      value: script_input.output.value
        |> assets.add(mocks.settings_nft_policy, mocks.settings_token_name, -1),
      datum: NoDatum,
      reference_script: None,
    }
  let tx =
    tx
      |> add_output(output)
      |> add_extra_signature(mocks.githoney_addr)

  githoney_contract.settings.spend(
    Some(datum),
    CloseSettings,
    script_input.output_reference,
    tx,
  )
}

test without_githoney_signature() {
  let tx = close_tx()
  expect Some(script_input) = head(tx.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let output =
    Output {
      address: mocks.mk_githoney_address(),
      value: script_input.output.value
        |> assets.add(mocks.settings_nft_policy, mocks.settings_token_name, -1),
      datum: NoDatum,
      reference_script: None,
    }
  let tx =
    tx
      |> add_output(output)

  !githoney_contract.settings.spend(
    Some(datum),
    CloseSettings,
    script_input.output_reference,
    tx,
  )
}

test without_settings_token_input() fail {
  let tx = close_tx()
  expect Some(script_input) = head(tx.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let output =
    Output {
      address: mocks.mk_githoney_address(),
      value: script_input.output.value
        |> assets.add(mocks.settings_nft_policy, mocks.settings_token_name, -1),
      datum: NoDatum,
      reference_script: None,
    }
  let tx =
    tx
      |> add_output(output)
      |> add_extra_signature(mocks.githoney_addr)
      |> script_input_without_settings_nft()

  githoney_contract.settings.spend(
    Some(datum),
    CloseSettings,
    script_input.output_reference,
    tx,
  )
}

test without_settings_token_burn() {
  let tx_without_value = mk_settings_transaction(CloseSettings)
  let tx =
    Transaction {
      ..tx_without_value,
      mint: assets.from_asset(
        mocks.settings_nft_policy,
        mocks.settings_token_name,
        1,
      ),
    }
  expect Some(script_input) = head(tx.inputs)
  let datum: SettingsDatum = to_settings_datum(script_input.output.datum)

  let output =
    Output {
      address: mocks.mk_githoney_address(),
      value: script_input.output.value
        |> assets.add(mocks.settings_nft_policy, mocks.settings_token_name, -1),
      datum: NoDatum,
      reference_script: None,
    }
  let tx =
    tx
      |> add_output(output)
      |> add_extra_signature(mocks.githoney_addr)

  !githoney_contract.settings.spend(
    Some(datum),
    CloseSettings,
    script_input.output_reference,
    tx,
  )
}
