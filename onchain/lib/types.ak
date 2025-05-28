use cardano/address.{Address, Credential}
use cardano/assets.{AssetName, PolicyId}

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

pub type SettingsDatum {
  githoney_address: Address,
  bounty_creation_fee: Int,
  bounty_reward_fee: Int,
}

pub type GithoneyDatum {
  admin_payment_credential: Credential,
  maintainer_address: Address,
  contributor_address: Option<Address>,
  bounty_reward_fee: Int,
  deadline: Int,
  merged: Bool,
  initial_value: Pairs<PolicyId, Pairs<AssetName, Int>>,
}
