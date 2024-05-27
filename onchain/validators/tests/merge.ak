use aiken/list.{head}
use aiken/transaction/value.{add, ada_policy_id, ada_asset_name, from_lovelace}
use aiken/transaction.{ScriptContext, Transaction, Output, NoDatum}
use test_utils.{mk_transition_script_context, change_output_address,
  change_script_output_datum, change_script_upper_bound,
  change_input_value, add_extra_signature, add_output}
use utils.{to_githoney_datum, min_ada}
use types.{GithoneyDatum, Merge}
use validations
use mocks

test success(){
  let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum = GithoneyDatum {
    ..datum,
    contributor_wallet: Some(mocks.mk_contributor_wallet())
  }
  let new_datum = GithoneyDatum {
    ..input_datum,
    merged: True
  }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)

  let maintainer_pay_output = Output {
    address: mocks.mk_maintainer_address(),
    value: from_lovelace(min_ada),
    datum: NoDatum,
    reference_script: None
  }

  let script_ctx =
    script_ctx
    |> change_script_output_datum(new_datum)
    |> change_input_value(0, script_value)
    |> add_extra_signature(mocks.admin_addr)
    |> add_output(maintainer_pay_output)

  validations.merge(input_datum, script_ctx)
}

test bad_new_datum(){
  let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum = GithoneyDatum {
    ..datum,
    contributor_wallet: Some(mocks.mk_contributor_wallet())
  }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)

  let maintainer_pay_output = Output {
    address: mocks.mk_maintainer_address(),
    value: from_lovelace(min_ada),
    datum: NoDatum,
    reference_script: None
  }

  let script_ctx =
    script_ctx
    |> change_script_output_datum(input_datum)
    |> change_input_value(0, script_value)
    |> add_extra_signature(mocks.admin_addr)
    |> add_output(maintainer_pay_output)

  !validations.merge(input_datum, script_ctx)
}

test bad_actual_datum(){
    let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum = GithoneyDatum {
    ..datum,
    merged: True,
    contributor_wallet: Some(mocks.mk_contributor_wallet())
  }
  let input_datum_2 = GithoneyDatum {
    ..datum,
    merged: False,
    contributor_wallet: None
  }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)

  let maintainer_pay_output = Output {
    address: mocks.mk_maintainer_address(),
    value: from_lovelace(min_ada),
    datum: NoDatum,
    reference_script: None
  }

  let script_ctx =
    script_ctx
    |> change_script_output_datum(input_datum)
    |> change_input_value(0, script_value)
    |> add_extra_signature(mocks.admin_addr)
    |> add_output(maintainer_pay_output)

  let script_ctx_2 =
    script_ctx
    |> change_script_output_datum(input_datum)
  !validations.merge(input_datum, script_ctx) &&
  !validations.merge(input_datum_2, script_ctx_2)
}

test bad_input_value(){
  let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum = GithoneyDatum {
    ..datum,
    contributor_wallet: Some(mocks.mk_contributor_wallet())
  }
  let new_datum = GithoneyDatum {
    ..input_datum,
    merged: True
  }

  let maintainer_pay_output = Output {
    address: mocks.mk_maintainer_address(),
    value: from_lovelace(min_ada),
    datum: NoDatum,
    reference_script: None
  }

  let script_ctx =
    script_ctx
    |> change_script_output_datum(new_datum)
    |> add_extra_signature(mocks.admin_addr)
    |> add_output(maintainer_pay_output)

  !validations.merge(input_datum, script_ctx)
}

test without_maintainer_pay(){
  let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum = GithoneyDatum {
    ..datum,
    contributor_wallet: Some(mocks.mk_contributor_wallet())
  }
  let new_datum = GithoneyDatum {
    ..input_datum,
    merged: True
  }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)

  let script_ctx =
    script_ctx
    |> change_script_output_datum(new_datum)
    |> change_input_value(0, script_value)
    |> add_extra_signature(mocks.admin_addr)

  !validations.merge(input_datum, script_ctx)
}

test without_admin_signature(){
    let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum = GithoneyDatum {
    ..datum,
    contributor_wallet: Some(mocks.mk_contributor_wallet())
  }
  let new_datum = GithoneyDatum {
    ..input_datum,
    merged: True
  }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)

  let maintainer_pay_output = Output {
    address: mocks.mk_maintainer_address(),
    value: from_lovelace(min_ada),
    datum: NoDatum,
    reference_script: None
  }

  let script_ctx =
    script_ctx
    |> change_script_output_datum(new_datum)
    |> change_input_value(0, script_value)
    |> add_output(maintainer_pay_output)
  !validations.merge(input_datum, script_ctx)
}

test bad_address(){
  let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum = GithoneyDatum {
    ..datum,
    contributor_wallet: Some(mocks.mk_contributor_wallet())
  }
  let new_datum = GithoneyDatum {
    ..input_datum,
    merged: True
  }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)

  let maintainer_pay_output = Output {
    address: mocks.mk_maintainer_address(),
    value: from_lovelace(min_ada),
    datum: NoDatum,
    reference_script: None
  }

  let script_ctx =
    script_ctx
    |> change_script_output_datum(new_datum)
    |> change_input_value(0, script_value)
    |> add_extra_signature(mocks.admin_addr)
    |> add_output(maintainer_pay_output)
    |> change_output_address(0, mocks.mk_contributor_address())

  !validations.merge(input_datum, script_ctx)
}


test after_deadline(){
  let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum = GithoneyDatum {
    ..datum,
    contributor_wallet: Some(mocks.mk_contributor_wallet())
  }
  let new_datum = GithoneyDatum {
    ..input_datum,
    merged: True
  }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)

  let maintainer_pay_output = Output {
    address: mocks.mk_maintainer_address(),
    value: from_lovelace(min_ada),
    datum: NoDatum,
    reference_script: None
  }

  let script_ctx =
    script_ctx
    |> change_script_output_datum(new_datum)
    |> change_input_value(0, script_value)
    |> add_extra_signature(mocks.admin_addr)
    |> add_output(maintainer_pay_output)
    |> change_script_upper_bound(datum.deadline + 1)
  !validations.merge(input_datum, script_ctx)
}