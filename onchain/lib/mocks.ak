use aiken/transaction.{
  InlineDatum, Input, Output, OutputReference, TransactionId,
}
use aiken/transaction/credential.{
  Address, ScriptCredential, VerificationKeyCredential,
}
use aiken/transaction/value
use types.{GithoneyDatum, GithoneyFee, Wallet}
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

pub const control_token_policy =
  #"551c576b4d0e330fcc94feda17a910d7338cb0687ed20b59e5c68a12"

pub const control_token_name = "controlToken"

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

pub fn mk_githoney_fee() {
  GithoneyFee {
    githoney_wallet: Wallet { payment_key: githoney_addr, stake_key: None },
    bounty_creation_fee: 20000,
    bounty_reward_fee: 10000,
  }
}

pub const bounty_id = "abc123"

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

// ========================================
// OUTPUTS
// ========================================
pub fn mk_output_bounty_utxo() {
  Output {
    address: Address {
      payment_credential: ScriptCredential(control_token_policy),
      stake_credential: None,
    },
    value: value.from_lovelace(min_ada)
      |> value.add(
           token_a_policy,
           token_a_name,
           mk_githoney_fee().bounty_reward_fee,
         ) // Reward token
      |> value.add(control_token_policy, control_token_name, 1),
    datum: InlineDatum(
      GithoneyDatum {
        admin_wallet: mk_admin_wallet(),
        maintainer_wallet: mk_maintainer_wallet(),
        contributor_wallet: None,
        bounty_id,
        deadline: 1718938800,
        merged: False,
      },
    ),
    reference_script: None,
  }
}
// ========================================
// DATUMS
// ========================================
// pub fn mk_bounty_datum() -> GithoneyDatum {
//   GithoneyDatum {
//     admin_wallet,
//     maintainer_wallet,
//     contributor_wallet: Some(contributor_wallet),
//     bounty_id: mocks.bounty_id,
//     deadline: 1715888789 + 604800,
//     merged: False,
//   }
// }
// ========================================
// EXTRA
// ========================================
