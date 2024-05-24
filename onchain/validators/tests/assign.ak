use aiken/list.{head}
use aiken/transaction/value.{add, ada_policy_id, ada_asset_name}
use aiken/transaction.{ScriptContext, Transaction, Output}
use test_utils.{mk_transition_script_context, change_output_value,
  change_script_output_datum, change_script_upper_bound}
use utils.{to_githoney_datum, min_ada}
use types.{GithoneyDatum, Assign}
use validations
use mocks

test success(){
  let script_ctx = mk_transition_script_context(Assign)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let new_datum = GithoneyDatum {
    ..datum,
    contributor_wallet: Some(mocks.mk_contributor_wallet())
  }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_output_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)

  let script_ctx = change_script_output_datum(script_ctx, new_datum)
  let script_ctx = change_output_value(script_ctx, 0, script_output_value)
  validations.assign(datum, script_ctx)
}

test bad_datum(){
  let script_ctx = mk_transition_script_context(Assign)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let new_datum = GithoneyDatum {
    ..datum,
    contributor_wallet: None
  }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_output_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)
  let script_ctx = change_script_output_datum(script_ctx, new_datum)
  let script_ctx = change_output_value(script_ctx, 0, script_output_value)
  !validations.assign(datum, script_ctx)
}

test bad_output_value(){
  let script_ctx = mk_transition_script_context(Assign)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let new_datum = GithoneyDatum {
    ..datum,
    contributor_wallet: Some(mocks.mk_contributor_wallet())
  }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_output_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, 1000)
  let script_ctx = change_script_output_datum(script_ctx, new_datum)
  let script_ctx = change_output_value(script_ctx, 0, script_output_value)
  !validations.assign(datum, script_ctx)
}

test after_deadline(){
  let script_ctx = mk_transition_script_context(Assign)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let new_datum = GithoneyDatum {
    ..datum,
    contributor_wallet: Some(mocks.mk_contributor_wallet())
  }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_output_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)
  let script_ctx = change_script_output_datum(script_ctx, new_datum)
  let script_ctx = change_output_value(script_ctx, 0, script_output_value)
  let script_ctx = change_script_upper_bound(script_ctx, datum.deadline + 1)
  !validations.assign(datum, script_ctx)
}