use aiken/collection/list
use cardano/address.{Address, Script}
use cardano/assets
use cardano/transaction.{NoDatum, Output, Transaction}
use githoney_contract
use mocks
use test_utils
use utils.{min_ada}

test general_test() {
  let tx = test_utils.mk_mp_transaction()

  githoney_contract.githoney.mint(mocks.settings_nft_policy, None, "", tx)
}

test wrong_datum() fail {
  let tx = test_utils.mk_mp_transaction()

  expect Some(bounty_utxo) = list.head(tx.outputs)
  let wrong_output = Output { ..bounty_utxo, datum: NoDatum }

  let wrong_tx = Transaction { ..tx, outputs: [wrong_output] }
  githoney_contract.githoney.mint(mocks.settings_nft_policy, None, "", wrong_tx)
}

test no_reward_assets() {
  let tx = test_utils.mk_mp_transaction()

  expect Some(outputs) = list.tail(tx.outputs)
  let wrong_value =
    assets.from_lovelace(min_ada)
      |> assets.add(mocks.bounty_id_policy, mocks.bounty_id_name, 1)
  let wrong_bounty = {
    expect Some(bounty_utxo) = list.head(tx.outputs)
    Output {
      ..bounty_utxo,
      datum: mocks.mk_script_datum(wrong_value),
      value: wrong_value,
    }
  }
  let wrong_tx = Transaction { ..tx, outputs: list.push(outputs, wrong_bounty) }
  !githoney_contract.githoney.mint(
    mocks.settings_nft_policy,
    None,
    "",
    wrong_tx,
  )
}

test no_min_ada() {
  let tx = test_utils.mk_mp_transaction()

  expect Some(outputs) = list.tail(tx.outputs)
  let wrong_value =
    assets.from_lovelace(1_000_000)
      |> assets.add(mocks.bounty_id_policy, mocks.bounty_id_name, 1)
      |> assets.add(mocks.token_a_policy, mocks.token_a_name, 1)
  let wrong_bounty = {
    expect Some(bounty_utxo) = list.head(tx.outputs)
    Output {
      ..bounty_utxo,
      datum: mocks.mk_script_datum(wrong_value),
      value: wrong_value,
    }
  }
  let wrong_tx = Transaction { ..tx, outputs: list.push(outputs, wrong_bounty) }
  !githoney_contract.githoney.mint(
    mocks.settings_nft_policy,
    None,
    "",
    wrong_tx,
  )
}

test fee_not_paid() {
  let tx = test_utils.mk_mp_transaction()

  expect Some(bounty_utxo) = list.head(tx.outputs)
  let out_githoney_address =
    Output {
      address: mocks.mk_githoney_address(),
      value: assets.zero,
      datum: NoDatum,
      reference_script: None,
    }

  let wrong_tx =
    Transaction { ..tx, outputs: [bounty_utxo, out_githoney_address] }
  !githoney_contract.githoney.mint(
    mocks.settings_nft_policy,
    None,
    "",
    wrong_tx,
  )
}

test wrong_value() {
  let tx = test_utils.mk_mp_transaction()

  expect Some(outputs) = list.tail(tx.outputs)
  let wrong_bounty = {
    expect Some(bounty_utxo) = list.head(tx.outputs)
    Output { ..bounty_utxo, value: assets.from_lovelace(1_234_567) }
  }
  let wrong_tx = Transaction { ..tx, outputs: list.push(outputs, wrong_bounty) }

  !githoney_contract.githoney.mint(
    mocks.settings_nft_policy,
    None,
    "",
    wrong_tx,
  )
}

test wrong_minted_amount() fail {
  let tx = test_utils.mk_mp_transaction()

  let wrong_tx =
    Transaction {
      ..tx,
      mint: assets.from_asset(mocks.bounty_id_policy, mocks.bounty_id_name, 1)
        |> assets.add("123456789", "other_token", 1),
    }
  githoney_contract.githoney.mint(mocks.settings_nft_policy, None, "", wrong_tx)
}

test wrong_burned_amount() {
  let tx = test_utils.mk_mp_transaction()

  let wrong_tx =
    Transaction {
      ..tx,
      mint: assets.from_asset(
        mocks.bounty_id_policy,
        mocks.bounty_id_name,
        -1234,
      ),
    }
  !githoney_contract.githoney.mint(
    mocks.settings_nft_policy,
    None,
    "",
    wrong_tx,
  )
}

test invalid_script_output_address() fail {
  let tx = test_utils.mk_mp_transaction()

  expect Some(outputs) = list.tail(tx.outputs)
  let wrong_bounty = {
    expect Some(bounty_utxo) = list.head(tx.outputs)
    Output {
      ..bounty_utxo,
      address: Address {
        payment_credential: Script("addr_test"),
        stake_credential: None,
      },
    }
  }
  let wrong_tx = Transaction { ..tx, outputs: list.push(outputs, wrong_bounty) }
  !githoney_contract.githoney.mint(
    mocks.settings_nft_policy,
    None,
    "",
    wrong_tx,
  )
}
