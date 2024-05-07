
use aiken/transaction.{ScriptContext, Datum, Redeemer}
use types.{GithoneyContractRedeemers, GithoneyFee}

validator(githoney_fee: GithoneyFee){
  fn githoney_contract(_datum: Datum, _redeemer:GithoneyContractRedeemers, _ctx: ScriptContext){
    True
  }

  fn githoney_policy(_redeemer:Redeemer, _ctx: ScriptContext){
    True
  }
}