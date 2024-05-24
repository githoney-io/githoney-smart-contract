use aiken/transaction.{Redeemer, ScriptContext}
use types.{
  AddRewards, Assign, Claim, Close, GithoneyContractRedeemers, GithoneyDatum,
  GithoneyFee, Merge,
}
use validations.{minting_policy, add_rewards, assign, merge, close, claim}

validator(githoney_fee: GithoneyFee) {
  fn githoney_contract(
    datum: GithoneyDatum,
    redeemer: GithoneyContractRedeemers,
    ctx: ScriptContext,
  ) {
    when redeemer is {
      AddRewards -> add_rewards(datum, ctx)
      Assign -> assign(datum, ctx)
      Merge -> merge(datum, ctx)
      Close -> close(datum, ctx)
      Claim -> claim(datum, ctx)
    }
  }

  fn githoney_policy(_redeemer: Redeemer, ctx: ScriptContext) {
    minting_policy(githoney_fee, ctx)
  }
}
