use aiken/list.{head}
use aiken/transaction.{Output, ScriptContext, Transaction}
use aiken/transaction/value.{ada_asset_name, ada_policy_id, add}
use mocks
use test_utils.{
  change_output_value, change_script_output_datum, change_script_upper_bound,
  mk_transition_script_context, script_input_without_bounty_id_token,
}
use types.{Assign, GithoneyDatum}
use utils.{min_ada, to_githoney_datum}
use validations

test success() {
  let script_ctx = mk_transition_script_context(Assign)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let new_datum =
    GithoneyDatum {
      ..datum,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_output_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)

  let script_ctx = change_script_output_datum(script_ctx, new_datum)
  let script_ctx = change_output_value(script_ctx, 0, script_output_value)
  validations.assign(datum, script_ctx)
}

test bad_datum() {
  let script_ctx = mk_transition_script_context(Assign)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let new_datum = GithoneyDatum { ..datum, contributor_wallet: None }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_output_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)
  let script_ctx = change_script_output_datum(script_ctx, new_datum)
  let script_ctx = change_output_value(script_ctx, 0, script_output_value)
  !validations.assign(datum, script_ctx)
}

test bad_output_value() {
  let script_ctx = mk_transition_script_context(Assign)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let new_datum =
    GithoneyDatum {
      ..datum,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_output_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, 1000)
  let script_ctx = change_script_output_datum(script_ctx, new_datum)
  let script_ctx = change_output_value(script_ctx, 0, script_output_value)
  !validations.assign(datum, script_ctx)
}

test after_deadline() {
  let script_ctx = mk_transition_script_context(Assign)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let new_datum =
    GithoneyDatum {
      ..datum,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_output_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)
  let script_ctx = change_script_output_datum(script_ctx, new_datum)
  let script_ctx = change_output_value(script_ctx, 0, script_output_value)
  let script_ctx = change_script_upper_bound(script_ctx, datum.deadline + 1)
  !validations.assign(datum, script_ctx)
}

test without_bounty_id_token() fail {
  let script_ctx = mk_transition_script_context(Assign)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let new_datum =
    GithoneyDatum {
      ..datum,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_output_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)

  let script_ctx =
    script_ctx
      |> change_script_output_datum(new_datum)
      |> change_output_value(0, script_output_value)
      |> script_input_without_bounty_id_token()

  validations.assign(datum, script_ctx)
}
