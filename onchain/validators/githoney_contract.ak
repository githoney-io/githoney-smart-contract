use aiken/transaction.{Redeemer, ScriptContext}
use types.{
  AddRewards, Assign, Claim, Close, GithoneyContractRedeemers, GithoneyDatum,
  GithoneyFee, Merge,
}
use validations.{add_rewards, assign, claim, close, merge, minting_policy}

validator(settings_policy_id: PolicyId) {
  fn githoney_contract(
    datum: GithoneyDatum,
    redeemer: GithoneyContractRedeemers,
    ctx: ScriptContext,
  ) {
    when redeemer is {
      AddRewards -> add_rewards(datum, ctx)
      Assign -> assign(datum, ctx)
      Merge -> merge(settings_policy_id, datum, ctx)
      Close -> close(datum, ctx)
      Claim -> claim(datum, ctx)
    }
  }

  fn githoney_policy(_redeemer: Redeemer, ctx: ScriptContext) {
    minting_policy(settings_policy_id, ctx)
  }
}
