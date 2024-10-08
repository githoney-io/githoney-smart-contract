use aiken/hash.{Blake2b_224, Hash}
use aiken/transaction/credential.{VerificationKey}
use aiken/transaction/value.{AssetName, PolicyId}

pub type AssetClass {
  policy_id: PolicyId,
  asset_name: AssetName,
}

pub type TokenInfo {
  asset: AssetClass,
  amount: Int,
}

pub type GithoneyContractRedeemers {
  AddRewards
  Assign
  Merge
  Close
  Claim
}

pub type SettingsRedeemers {
  UpdateSettings
  CloseSettings
}

pub type Wallet {
  payment_key: VerificationKeyHash,
  stake_key: Option<VerificationKeyHash>,
}

pub type SettingsDatum {
  githoney_wallet: Wallet,
  bounty_creation_fee: Int,
  bounty_reward_fee: Int,
}

pub type GithoneyDatum {
  admin_wallet: Wallet,
  maintainer_wallet: Wallet,
  contributor_wallet: Option<Wallet>,
  bounty_reward_fee: Int,
  deadline: Int,
  merged: Bool,
  initial_value: List<TokenInfo>,
}

/// This is a hash of the sender's (or receiver) verification key.
pub type VerificationKeyHash =
  Hash<Blake2b_224, VerificationKey>
