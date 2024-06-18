use aiken/list.{head}
use aiken/transaction.{NoDatum, Output, ScriptContext, Transaction}
use aiken/transaction/value.{from_lovelace, merge, negate}
use mocks
use test_utils.{
  add_extra_signature, add_output, mk_burn_script_context,
  remove_mint_from_context, script_input_without_bounty_id_token,
}
use types.{CloseSettings, SettingsDatum}
use utils.{min_ada, to_settings_datum}
use validations

test success() {
  todo
}

test without_githoney_signature() {
  todo
}

test githoney_bad_pay() {
  todo
}

test without_settings_token() {
  todo
}

test without_settings_token_burn() {
  todo
}
