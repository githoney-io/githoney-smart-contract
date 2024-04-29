
use aiken/transaction.{ScriptContext, Datum}
use types.{GithoneyContractRedeemers}

validator(){
  fn githoney_contract(_datum: Datum, _redeemer:GithoneyContractRedeemers, _ctx: ScriptContext){
    True
  }
}