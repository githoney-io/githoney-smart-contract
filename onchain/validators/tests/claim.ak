use aiken/list.{head}
use aiken/transaction.{NoDatum, Output, ScriptContext, Transaction}
use aiken/transaction/value.{from_lovelace}
use mocks
use test_utils.{
  add_output, mk_burn_script_context, script_input_without_control_token,
}
use types.{Claim, GithoneyDatum}
use utils.{to_githoney_datum}
use validations

test success() {
  let script_ctx = mk_burn_script_context(Claim)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum =
    GithoneyDatum {
      ..datum,
      merged: True,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  let output =
    Output {
      address: mocks.mk_contributor_address(),
      value: script_input.output.value,
      datum: NoDatum,
      reference_script: None,
    }
  let script_ctx = add_output(script_ctx, output)

  validations.claim(input_datum, script_ctx)
}

test not_merged() {
  let script_ctx = mk_burn_script_context(Claim)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum =
    GithoneyDatum {
      ..datum,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  let output =
    Output {
      address: mocks.mk_contributor_address(),
      value: script_input.output.value,
      datum: NoDatum,
      reference_script: None,
    }
  let script_ctx = add_output(script_ctx, output)

  !validations.claim(input_datum, script_ctx)
}

test without_contributor() fail {
  let script_ctx = mk_burn_script_context(Claim)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum = GithoneyDatum { ..datum, merged: True }
  let output =
    Output {
      address: mocks.mk_contributor_address(),
      value: script_input.output.value,
      datum: NoDatum,
      reference_script: None,
    }
  let script_ctx = add_output(script_ctx, output)

  validations.claim(input_datum, script_ctx)
}

test contributor_bad_pay() {
  let script_ctx = mk_burn_script_context(Claim)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum =
    GithoneyDatum {
      ..datum,
      merged: True,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  let output =
    Output {
      address: mocks.mk_contributor_address(),
      value: from_lovelace(1),
      datum: NoDatum,
      reference_script: None,
    }
  let script_ctx = add_output(script_ctx, output)

  !validations.claim(input_datum, script_ctx)
}

test without_control_token() fail {
  let script_ctx = mk_burn_script_context(Claim)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum =
    GithoneyDatum {
      ..datum,
      merged: True,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  let output =
    Output {
      address: mocks.mk_contributor_address(),
      value: script_input.output.value,
      datum: NoDatum,
      reference_script: None,
    }
  let script_ctx =
    script_ctx
      |> add_output(output)
      |> script_input_without_control_token()

  validations.claim(input_datum, script_ctx)
}
