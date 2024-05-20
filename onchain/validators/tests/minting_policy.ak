use aiken/list
use aiken/transaction.{InlineDatum, Input, Output, ScriptContext, Transaction}
use aiken/transaction/credential.{
  Address, ScriptCredential, VerificationKeyCredential,
}
use checks
use mocks
use test_utils

test general_test() {
  let ctx = test_utils.mk_mp_script_context()
  let redeemer = #""
  checks.check_minting_policy(
    mocks.githoney_addr,
    mocks.githoney_fee,
    redeemer,
    ctx,
  )
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
