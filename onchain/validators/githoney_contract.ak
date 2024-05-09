
use aiken/transaction.{ScriptContext, Redeemer}
use types.{GithoneyContractRedeemers, GithoneyFee, GithoneyDatum}

validator(_githoney_fee: GithoneyFee){
  fn githoney_contract(_datum: GithoneyDatum, _redeemer:GithoneyContractRedeemers, _ctx: ScriptContext){
    True
  }

  fn githoney_policy(_redeemer:Redeemer, _ctx: ScriptContext){
    True
  }
}