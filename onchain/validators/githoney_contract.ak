
use aiken/transaction.{ ScriptContext, Datum, Redeemer }
use aiken/transaction/value.{ from_lovelace }
use aiken/transaction/credential.{ from_script }
use types.{ GithoneyContractRedeemers, GithoneyFee }
use utils.{ get_first_output, get_minting_info, to_githoney_datum, control_token_name, value_paid_to }
use checks.{ is_utxo_value_valid, is_utxo_datum_valid }

validator(githoney_fee: GithoneyFee){
  fn githoney_contract(_datum: Datum, _redeemer:GithoneyContractRedeemers, _ctx: ScriptContext){
    True
  }

  fn githoney_policy(_redeemer:Redeemer, ctx: ScriptContext){
    let (own_policy, minted_name, minted_quantity) = get_minting_info(ctx.transaction)

    let is_token_burned = minted_quantity == -1
    if is_token_burned { True }
    else{
      let script_output = get_first_output(ctx)
      let datum = to_githoney_datum(script_output)

      let is_minting_only_one_control_token =
        minted_quantity == 1 && minted_name == control_token_name
      let is_script_output_address_valid = script_output.address == from_script(own_policy)
      let is_creation_fee_paid =
        value_paid_to(githoney_fee.githoney_wallet, ctx.transaction)
          == from_lovelace(githoney_fee.bounty_creation_fee)

      is_creation_fee_paid &&
      is_minting_only_one_control_token &&
      is_script_output_address_valid &&
      is_utxo_datum_valid(ctx.transaction, datum) &&
      is_utxo_value_valid(own_policy, script_output.value)
    }
  }
}