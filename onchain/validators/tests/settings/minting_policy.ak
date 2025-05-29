use aiken/collection/list
use cardano/assets
use cardano/transaction.{NoDatum, Output, Transaction}
use githoney_contract
use mocks
use test_utils

test success() {
  let tx = test_utils.mk_mp_settings_transaction()

  githoney_contract.settings_minting.mint(
    mocks.mk_settings_out_ref(),
    mocks.mk_settings_address(),
    None,
    mocks.settings_nft_policy,
    tx,
  )
}

test wrong_datum() fail {
  let tx = test_utils.mk_mp_settings_transaction()

  expect Some(settings_utxo) = list.head(tx.outputs)
  let wrong_output = Output { ..settings_utxo, datum: NoDatum }

  let wrong_tx = Transaction { ..tx, outputs: [wrong_output] }

  githoney_contract.settings_minting.mint(
    mocks.mk_settings_out_ref(),
    mocks.mk_settings_address(),
    None,
    mocks.settings_nft_policy,
    wrong_tx,
  )
}

test wrong_minted_amount() fail {
  let tx = test_utils.mk_mp_settings_transaction()

  let wrong_tx =
    Transaction {
      ..tx,
      mint: assets.from_asset(
        mocks.settings_nft_policy,
        mocks.settings_token_name,
        1,
      )
        |> assets.add("123456789", "other_token", 1),
    }
  githoney_contract.settings_minting.mint(
    mocks.mk_settings_out_ref(),
    mocks.mk_settings_address(),
    None,
    mocks.settings_nft_policy,
    wrong_tx,
  )
}

test wrong_burned_amount() {
  let tx = test_utils.mk_mp_settings_transaction()

  let wrong_tx =
    Transaction {
      ..tx,
      mint: assets.from_asset(
        mocks.settings_nft_policy,
        mocks.settings_token_name,
        -1234,
      ),
    }
  !githoney_contract.settings_minting.mint(
    mocks.mk_settings_out_ref(),
    mocks.mk_settings_address(),
    None,
    mocks.settings_nft_policy,
    wrong_tx,
  )
}

test utxo_not_present_in_inputs() {
  let tx = test_utils.mk_mp_settings_transaction()

  let wrong_tx = Transaction { ..tx, inputs: [] }
  !githoney_contract.settings_minting.mint(
    mocks.mk_settings_out_ref(),
    mocks.mk_settings_address(),
    None,
    mocks.settings_nft_policy,
    wrong_tx,
  )
}

test without_settings_token_in_output() {
  let tx = test_utils.mk_mp_settings_transaction()

  let wrong_output = Output { ..mocks.mk_settings_output(), value: assets.zero }

  let wrong_tx = Transaction { ..tx, outputs: [wrong_output] }
  !githoney_contract.settings_minting.mint(
    mocks.mk_settings_out_ref(),
    mocks.mk_settings_address(),
    None,
    mocks.settings_nft_policy,
    wrong_tx,
  )
}
