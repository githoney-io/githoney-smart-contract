use aiken/collection/dict.{to_pairs}
use aiken/collection/list
use cardano/address.{Address, Script, VerificationKey}
use cardano/assets.{AssetName, PolicyId, Value, policies, tokens}
use cardano/transaction.{InlineDatum, Input, Output, OutputReference}
use types.{GithoneyDatum, SettingsDatum}
use utils.{min_ada}

// This module includes mock values for testing the main validator and minting policy.

// =========
// CONSTANTS
// =========
pub const admin_addr =
  #"4db211c7d92c5092f19f9d6825813029e9da46d31ad1b00da0ca10cb"

pub const maintainer_addr =
  #"2d7103fdaf4beecbbef37edc6d24d311230f2836d0af791e3a6364d2"

pub const githoney_addr =
  #"60cef7fb5f89a9c76a65acdd746d9e84104d6f824d7dc44f427fcaa1dd"

pub const contributor_addr =
  #"70f5542fa9d9c61b4dbccd71654cc5a72a9fddc9d563f503682e772ec9"

pub const settings_addr =
  #"70f5542fa9d9c61b4dbccd71654cc5a72a9fddc9d545f503682e772ec9"

pub const bounty_id_policy =
  #"551c576b4d0e330fcc94feda17a910d7338cb0687ed20b59e5c68a12"

pub const bounty_id_name = "bounty Id"

pub const settings_nft_policy =
  #"551c576b4d0e330fcc94feda17a910d7338cb0687ed20b59e5c68a32"

pub const settings_token_name = "settingsNFT"

pub const token_a_policy =
  #"bab31a281f888aa25f6fd7b0754be83729069d66ad76c98be4a06deb"

pub const token_a_name = "tokenA"

pub const token_b_policy =
  #"e405207b08c38ea5815e2df27ad409b037adec32f7285ef0d15f6aa9"

pub const token_b_name = "tokenB"

pub const token_c_policy =
  #"e8399c4bb9c7bb89f11091469165e4c917229df34edbb2bb2d15c8b4"

pub const token_c_name = "tokenC"

pub const transaction_id =
  #"d324f89e2a7421b5a58db5e644ee31700a9a2435b1a97167c926877348b57334"

pub const transaction_id_2 =
  #"6dcd4ce23d88e2ee95838f4b759b3456c63d219231a64a3ce6dd2bf72f5c5b6a"

pub const transaction_id_3 =
  #"f5c5b6a6d88e2ee95838f3449558818e97ed211231a64a3ce6d877348b53db6a"

pub const reward_amount = 1000

pub const reward_fee = 1000

pub fn mk_settings_datum() {
  SettingsDatum {
    githoney_address: Address {
      payment_credential: VerificationKey(githoney_addr),
      stake_credential: None,
    },
    bounty_creation_fee: 20000,
    bounty_reward_fee: reward_fee,
  }
}

pub fn mk_script_datum(value: Value) {
  let initial_value = value |> assets.add(bounty_id_policy, bounty_id_name, -1)

  let initial_value_pairs =
    policies(initial_value)
      |> list.foldl(
          [],
          fn(policy: PolicyId, acc: Pairs<PolicyId, Pairs<AssetName, Int>>) {
            list.push(
              acc,
              Pair(policy, tokens(initial_value, policy) |> to_pairs),
            )
          },
        )

  InlineDatum(
    GithoneyDatum {
      admin_payment_credential: mk_admin_credential(),
      maintainer_address: mk_maintainer_address(),
      contributor_address: None,
      bounty_reward_fee: reward_fee,
      deadline: 1718938800,
      merged: False,
      initial_value: initial_value_pairs,
    },
  )
}

// ====================
// MOCK DATA GENERATION
// ====================

// ========================================
// ADDRESSES
// ========================================

pub fn mk_admin_address() {
  Address {
    payment_credential: VerificationKey(admin_addr),
    stake_credential: None,
  }
}

pub fn mk_admin_credential() {
  VerificationKey(admin_addr)
}

pub fn mk_maintainer_address() {
  Address {
    payment_credential: VerificationKey(maintainer_addr),
    stake_credential: None,
  }
}

pub fn mk_githoney_address() {
  Address {
    payment_credential: VerificationKey(githoney_addr),
    stake_credential: None,
  }
}

pub fn mk_contributor_address() {
  Address {
    payment_credential: VerificationKey(contributor_addr),
    stake_credential: None,
  }
}

pub fn mk_settings_address() {
  Address {
    payment_credential: Script(settings_addr),
    stake_credential: None,
  }
}

// ========================================
// INPUTS
// ========================================
pub fn script_out_ref() {
  OutputReference { transaction_id, output_index: 1 }
}

pub fn mk_input_bounty_utxo() {
  Input { output: mk_output_bounty_utxo(), output_reference: script_out_ref() }
}

pub fn mk_settings_out_ref() {
  OutputReference { transaction_id: transaction_id_2, output_index: 0 }
}

pub fn mk_settings_input() {
  Input {
    output: mk_settings_output(),
    output_reference: mk_settings_out_ref(),
  }
}

// ========================================
// OUTPUTS
// ========================================
pub fn mk_output_bounty_utxo() {
  let value =
    assets.from_lovelace(min_ada)
      |> assets.add(token_a_policy, token_a_name, reward_amount)
      // Reward token
      |> assets.add(bounty_id_policy, bounty_id_name, 1)
  Output {
    address: Address {
      payment_credential: Script(bounty_id_policy),
      stake_credential: None,
    },
    value,
    datum: mk_script_datum(value),
    reference_script: None,
  }
}

pub fn mk_settings_output() {
  Output {
    address: mk_settings_address(),
    value: assets.from_lovelace(min_ada)
      |> assets.add(settings_nft_policy, settings_token_name, 1),
    datum: InlineDatum(mk_settings_datum()),
    reference_script: None,
  }
}
// ========================================
// DATUMS
// ========================================

// ========================================
// EXTRA
// ========================================
