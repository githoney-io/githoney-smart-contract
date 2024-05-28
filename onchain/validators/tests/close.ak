use aiken/list.{head}
use aiken/transaction.{NoDatum, Output, ScriptContext, Transaction}
use aiken/transaction/value.{from_lovelace, merge, negate}
use mocks
use test_utils.{
  add_extra_signature, add_output, mk_burn_script_context,
  remove_mint_from_context, script_input_without_control_token,
}
use types.{Close, GithoneyDatum}
use utils.{min_ada, to_githoney_datum}
use validations

test success() {
  let script_ctx = mk_burn_script_context(Close)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let output =
    Output {
      address: mocks.mk_maintainer_address(),
      value: script_input.output.value,
      datum: NoDatum,
      reference_script: None,
    }
  let script_ctx =
    script_ctx
      |> add_output(output)
      |> add_extra_signature(mocks.admin_addr)

  validations.close(datum, script_ctx)
}

test success_with_contributor() {
  let script_ctx = mk_burn_script_context(Close)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum =
    GithoneyDatum {
      ..datum,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  let maintainer_pay_output =
    Output {
      address: mocks.mk_maintainer_address(),
      value: merge(script_input.output.value, negate(from_lovelace(min_ada))),
      datum: NoDatum,
      reference_script: None,
    }
  let contributor_pay_output =
    Output {
      address: mocks.mk_contributor_address(),
      value: from_lovelace(min_ada),
      datum: NoDatum,
      reference_script: None,
    }
  let script_ctx =
    script_ctx
      |> add_output(maintainer_pay_output)
      |> add_output(contributor_pay_output)
      |> add_extra_signature(mocks.admin_addr)

  validations.close(input_datum, script_ctx)
}

test without_admin_signature() {
  let script_ctx = mk_burn_script_context(Close)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let output =
    Output {
      address: mocks.mk_maintainer_address(),
      value: script_input.output.value,
      datum: NoDatum,
      reference_script: None,
    }
  let script_ctx =
    script_ctx
      |> add_output(output)

  !validations.close(datum, script_ctx)
}

test contributor_bad_pay() {
  let script_ctx = mk_burn_script_context(Close)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum =
    GithoneyDatum {
      ..datum,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  let maintainer_pay_output =
    Output {
      address: mocks.mk_maintainer_address(),
      value: script_input.output.value,
      datum: NoDatum,
      reference_script: None,
    }
  let script_ctx =
    script_ctx
      |> add_output(maintainer_pay_output)
      |> add_extra_signature(mocks.admin_addr)

  !validations.close(input_datum, script_ctx)
}

test maintainer_bad_pay() {
  let script_ctx = mk_burn_script_context(Close)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let output =
    Output {
      address: mocks.mk_maintainer_address(),
      value: merge(script_input.output.value, negate(from_lovelace(min_ada))),
      datum: NoDatum,
      reference_script: None,
    }
  let script_ctx =
    script_ctx
      |> add_output(output)
      |> add_extra_signature(mocks.admin_addr)

  !validations.close(datum, script_ctx)
}

test without_control_token() fail {
  let script_ctx = mk_burn_script_context(Close)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let output =
    Output {
      address: mocks.mk_maintainer_address(),
      value: script_input.output.value,
      datum: NoDatum,
      reference_script: None,
    }
  let script_ctx =
    script_ctx
      |> add_output(output)
      |> add_extra_signature(mocks.admin_addr)
      |> script_input_without_control_token()

  validations.close(datum, script_ctx)
}

test without_control_token_burn() fail {
  let script_ctx = mk_burn_script_context(Close)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let output =
    Output {
      address: mocks.mk_maintainer_address(),
      value: script_input.output.value,
      datum: NoDatum,
      reference_script: None,
    }
  let script_ctx =
    script_ctx
      |> add_output(output)
      |> add_extra_signature(mocks.admin_addr)
      |> remove_mint_from_context()

  validations.close(datum, script_ctx)
}
