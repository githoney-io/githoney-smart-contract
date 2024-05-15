use aiken/list
use aiken/transaction.{InlineDatum, Input, Output, ScriptContext, Transaction}
use aiken/transaction/credential.{
  Address, ScriptCredential, VerificationKeyCredential,
}
use checks
use test_utils

test general_test() {
  todo {
    let ctx = test_utils.mk_mp_script_context()
  }
  let redeemer = #""
  let datum = #""
  checks.check_minting_policy(githoney_fee, datum, redeemer, ctx)
}

test wrong_datum() {
  todo
}

test fee_not_paid() {
  todo
}

test wrong_value() {
  todo
}

test wrong_minted_amount() {
  todo
}

test wrong_burned_amount() {
  todo
}

test invalid_script_output_address() {
  todo
}
