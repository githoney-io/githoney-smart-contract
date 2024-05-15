use aiken/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, TransactionId,
}
use aiken/transaction/credential.{
  Address, ScriptCredential, VerificationKeyCredential,
}
use aiken/transaction/value

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

pub const githoney_fee = 2000
// ====================
// MOCK DATA GENERATION
// ====================

// ========================================
// INPUTS
// ========================================

// ========================================
// OUTPUTS
// ========================================

// ========================================
// ADDRESSES
// ========================================

// ========================================
// DATUMS
// ========================================

// ========================================
// EXTRA
// ========================================
