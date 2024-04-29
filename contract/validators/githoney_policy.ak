
use aiken/transaction.{Redeemer, ScriptContext, OutputReference}

validator(txHash: ByteArray, outputIndex: Int){
  fn githoney_policy(_redeemer:Redeemer, _ctx: ScriptContext){
    True
  }
}