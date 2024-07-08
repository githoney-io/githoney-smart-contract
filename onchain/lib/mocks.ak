use aiken/transaction.{
  InlineDatum, Input, Output, OutputReference, TransactionId,
}
use aiken/transaction/credential.{
  Address, ScriptCredential, VerificationKeyCredential,
}
use aiken/transaction/value.{ada_asset_name, ada_policy_id}
use types.{AssetClass, GithoneyDatum, SettingsDatum, TokenInfo, Wallet}
use utils.{min_ada, settings_token_name}

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
    githoney_wallet: Wallet { payment_key: githoney_addr, stake_key: None },
    bounty_creation_fee: 20000,
    bounty_reward_fee: reward_fee,
  }
}

// ====================
// MOCK DATA GENERATION
// ====================

// ========================================
// ADDRESSES
// ========================================

pub fn mk_admin_address() {
  Address {
    payment_credential: VerificationKeyCredential(admin_addr),
    stake_credential: None,
  }
}

pub fn mk_maintainer_address() {
  Address {
    payment_credential: VerificationKeyCredential(maintainer_addr),
    stake_credential: None,
  }
}

pub fn mk_githoney_address() {
  Address {
    payment_credential: VerificationKeyCredential(githoney_addr),
    stake_credential: None,
  }
}

pub fn mk_contributor_address() {
  Address {
    payment_credential: VerificationKeyCredential(contributor_addr),
    stake_credential: None,
  }
}

pub fn mk_settings_address() {
  Address {
    payment_credential: VerificationKeyCredential(settings_addr),
    stake_credential: None,
  }
}

// ========================================
// WALLETS
// ========================================

pub fn mk_contributor_wallet() {
  Wallet { payment_key: contributor_addr, stake_key: None }
}

pub fn mk_admin_wallet() {
  Wallet { payment_key: admin_addr, stake_key: None }
}

pub fn mk_maintainer_wallet() {
  Wallet { payment_key: maintainer_addr, stake_key: None }
}

pub fn mk_githoney_wallet() {
  Wallet { payment_key: githoney_addr, stake_key: None }
}

// ========================================
// INPUTS
// ========================================
pub fn script_out_ref() {
  OutputReference {
    transaction_id: TransactionId { hash: transaction_id },
    output_index: 1,
  }
}

pub fn mk_input_bounty_utxo() {
  Input { output: mk_output_bounty_utxo(), output_reference: script_out_ref() }
}

pub fn mk_settings_out_ref() {
  OutputReference {
    transaction_id: TransactionId { hash: transaction_id_2 },
    output_index: 0,
  }
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
  Output {
    address: Address {
      payment_credential: ScriptCredential(bounty_id_policy),
      stake_credential: None,
    },
    value: value.from_lovelace(min_ada)
      |> value.add(token_a_policy, token_a_name, reward_amount) // Reward token
      |> value.add(bounty_id_policy, bounty_id_name, 1),
    datum: InlineDatum(
      GithoneyDatum {
        admin_wallet: mk_admin_wallet(),
        maintainer_wallet: mk_maintainer_wallet(),
        contributor_wallet: None,
        bounty_reward_fee: reward_fee,
        deadline: 1718938800,
        merged: False,
        initial_value: [
          TokenInfo {
            asset: AssetClass {
              policy_id: ada_policy_id,
              asset_name: ada_asset_name,
            },
            amount: min_ada,
          },
          TokenInfo {
            asset: AssetClass {
              policy_id: token_a_policy,
              asset_name: token_a_name,
            },
            amount: reward_amount,
          },
        ],
      },
    ),
    reference_script: None,
  }
}

pub fn mk_settings_output() {
  Output {
    address: mk_settings_address(),
    value: value.from_lovelace(min_ada)
      |> value.add(settings_nft_policy, settings_token_name, 1),
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
