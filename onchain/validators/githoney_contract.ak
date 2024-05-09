
use aiken/transaction/value.{ quantity_of }
use aiken/transaction.{ ScriptContext, Datum, Redeemer }
use types.{ GithoneyContractRedeemers, GithoneyFee }
use utils.{ get_first_output, get_minting_info, to_githoney_datum, control_token_name }
use checks.{ is_utxo_value_valid }

validator(githoney_fee: GithoneyFee){
  fn githoney_contract(_datum: Datum, _redeemer:GithoneyContractRedeemers, _ctx: ScriptContext){
    True
  }

  fn githoney_policy(_redeemer:Redeemer, ctx: ScriptContext){
    let (own_policy, minted_name, minted_quantity) = get_minting_info(ctx.transaction)

    let is_token_burned = minted_quantity == -1
    if is_token_burned { True }
    else{
      let githoney_output = get_first_output(ctx)
      let datum = to_githoney_datum(githoney_utxo)

      let is_minting_only_one_control_token =
        minted_quantity == 1 && minted_name == control_token_name
      let is_githoney_output_address_valid = githoney_output.address == own_policy

      is_minting_only_one_control_token &&
      is_githoney_output_address_valid &&
      is_utxo_value_valid(own_policy, githoney_output.value)
    }
  }
}