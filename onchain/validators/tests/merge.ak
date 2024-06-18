use aiken/list.{head}
use aiken/transaction.{NoDatum, Output, ScriptContext, Transaction}
use aiken/transaction/value.{
  ada_asset_name, ada_policy_id, add, from_asset, from_lovelace, merge,
}
use mocks
use test_utils.{
  add_extra_signature, add_output, change_input_value, change_output_address,
  change_output_value, change_script_output_datum, change_script_upper_bound,
  mk_transition_script_context, script_input_without_bounty_id_token,
}
use types.{GithoneyDatum, Merge}
use utils.{min_ada, to_githoney_datum}
use validations

test success() {
  let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum =
    GithoneyDatum {
      ..datum,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  let new_datum = GithoneyDatum { ..input_datum, merged: True }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_input_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)
  let githoney_fee_amount = mocks.reward_amount * mocks.reward_fee / 10000
  let script_output_value =
    merge(
      script_output.value,
      from_asset(mocks.token_a_policy, mocks.token_a_name, -githoney_fee_amount),
    )

  let githoney_pay_output =
    Output {
      address: mocks.mk_githoney_address(),
      value: from_asset(
        mocks.token_a_policy,
        mocks.token_a_name,
        githoney_fee_amount,
      ),
      datum: NoDatum,
      reference_script: None,
    }

  let maintainer_pay_output =
    Output {
      address: mocks.mk_maintainer_address(),
      value: from_lovelace(min_ada),
      datum: NoDatum,
      reference_script: None,
    }

  let script_ctx =
    script_ctx
      |> change_script_output_datum(new_datum)
      |> change_output_value(0, script_output_value)
      |> change_input_value(0, script_input_value)
      |> add_extra_signature(mocks.admin_addr)
      |> add_output(maintainer_pay_output)
      |> add_output(githoney_pay_output)

  validations.merge(mocks.settings_nft_policy, input_datum, script_ctx)
}

test bad_new_datum() {
  let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum =
    GithoneyDatum {
      ..datum,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_input_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)
  let githoney_fee_amount = mocks.reward_amount * mocks.reward_fee / 10000
  let script_output_value =
    merge(
      script_output.value,
      from_asset(mocks.token_a_policy, mocks.token_a_name, -githoney_fee_amount),
    )

  let githoney_pay_output =
    Output {
      address: mocks.mk_githoney_address(),
      value: from_asset(
        mocks.token_a_policy,
        mocks.token_a_name,
        githoney_fee_amount,
      ),
      datum: NoDatum,
      reference_script: None,
    }

  let maintainer_pay_output =
    Output {
      address: mocks.mk_maintainer_address(),
      value: from_lovelace(min_ada),
      datum: NoDatum,
      reference_script: None,
    }

  let script_ctx =
    script_ctx
      |> change_script_output_datum(input_datum)
      |> change_output_value(0, script_output_value)
      |> change_input_value(0, script_input_value)
      |> add_extra_signature(mocks.admin_addr)
      |> add_output(maintainer_pay_output)
      |> add_output(githoney_pay_output)

  !validations.merge(mocks.settings_nft_policy, input_datum, script_ctx)
}

test bad_actual_datum() {
  let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum =
    GithoneyDatum {
      ..datum,
      merged: True,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  let new_datum = GithoneyDatum { ..input_datum, merged: True }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_input_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)
  let githoney_fee_amount = mocks.reward_amount * mocks.reward_fee / 10000
  let script_output_value =
    merge(
      script_output.value,
      from_asset(mocks.token_a_policy, mocks.token_a_name, -githoney_fee_amount),
    )

  let githoney_pay_output =
    Output {
      address: mocks.mk_githoney_address(),
      value: from_asset(
        mocks.token_a_policy,
        mocks.token_a_name,
        githoney_fee_amount,
      ),
      datum: NoDatum,
      reference_script: None,
    }

  let maintainer_pay_output =
    Output {
      address: mocks.mk_maintainer_address(),
      value: from_lovelace(min_ada),
      datum: NoDatum,
      reference_script: None,
    }

  let script_ctx =
    script_ctx
      |> change_script_output_datum(new_datum)
      |> change_output_value(0, script_output_value)
      |> change_input_value(0, script_input_value)
      |> add_extra_signature(mocks.admin_addr)
      |> add_output(maintainer_pay_output)
      |> add_output(githoney_pay_output)

  !validations.merge(mocks.settings_nft_policy, input_datum, script_ctx)
}

test bad_input_value() {
  let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum =
    GithoneyDatum {
      ..datum,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  let new_datum = GithoneyDatum { ..input_datum, merged: True }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let githoney_fee_amount = mocks.reward_amount * mocks.reward_fee / 10000
  let script_output_value =
    merge(
      script_output.value,
      from_asset(mocks.token_a_policy, mocks.token_a_name, -githoney_fee_amount),
    )

  let githoney_pay_output =
    Output {
      address: mocks.mk_githoney_address(),
      value: from_asset(
        mocks.token_a_policy,
        mocks.token_a_name,
        githoney_fee_amount,
      ),
      datum: NoDatum,
      reference_script: None,
    }

  let maintainer_pay_output =
    Output {
      address: mocks.mk_maintainer_address(),
      value: from_lovelace(min_ada),
      datum: NoDatum,
      reference_script: None,
    }

  let script_ctx =
    script_ctx
      |> change_script_output_datum(new_datum)
      |> change_output_value(0, script_output_value)
      |> add_extra_signature(mocks.admin_addr)
      |> add_output(maintainer_pay_output)
      |> add_output(githoney_pay_output)

  !validations.merge(mocks.settings_nft_policy, input_datum, script_ctx)
}

test without_maintainer_pay() {
  let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum =
    GithoneyDatum {
      ..datum,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  let new_datum = GithoneyDatum { ..input_datum, merged: True }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_input_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)
  let githoney_fee_amount = mocks.reward_amount * mocks.reward_fee / 10000
  let script_output_value =
    merge(
      script_output.value,
      from_asset(mocks.token_a_policy, mocks.token_a_name, -githoney_fee_amount),
    )

  let githoney_pay_output =
    Output {
      address: mocks.mk_githoney_address(),
      value: from_asset(
        mocks.token_a_policy,
        mocks.token_a_name,
        githoney_fee_amount,
      ),
      datum: NoDatum,
      reference_script: None,
    }

  let script_ctx =
    script_ctx
      |> change_script_output_datum(new_datum)
      |> change_output_value(0, script_output_value)
      |> change_input_value(0, script_input_value)
      |> add_extra_signature(mocks.admin_addr)
      |> add_output(githoney_pay_output)

  !validations.merge(mocks.settings_nft_policy, input_datum, script_ctx)
}

test without_admin_signature() {
  let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum =
    GithoneyDatum {
      ..datum,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  let new_datum = GithoneyDatum { ..input_datum, merged: True }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_input_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)
  let githoney_fee_amount = mocks.reward_amount * mocks.reward_fee / 10000
  let script_output_value =
    merge(
      script_output.value,
      from_asset(mocks.token_a_policy, mocks.token_a_name, -githoney_fee_amount),
    )

  let githoney_pay_output =
    Output {
      address: mocks.mk_githoney_address(),
      value: from_asset(
        mocks.token_a_policy,
        mocks.token_a_name,
        githoney_fee_amount,
      ),
      datum: NoDatum,
      reference_script: None,
    }

  let maintainer_pay_output =
    Output {
      address: mocks.mk_maintainer_address(),
      value: from_lovelace(min_ada),
      datum: NoDatum,
      reference_script: None,
    }

  let script_ctx =
    script_ctx
      |> change_script_output_datum(new_datum)
      |> change_output_value(0, script_output_value)
      |> change_input_value(0, script_input_value)
      |> add_output(maintainer_pay_output)
      |> add_output(githoney_pay_output)

  !validations.merge(mocks.settings_nft_policy, input_datum, script_ctx)
}

test without_githoney_pay() {
  let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum =
    GithoneyDatum {
      ..datum,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  let new_datum = GithoneyDatum { ..input_datum, merged: True }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_input_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)
  let githoney_fee_amount = mocks.reward_amount * mocks.reward_fee / 10000
  let script_output_value =
    merge(
      script_output.value,
      from_asset(mocks.token_a_policy, mocks.token_a_name, -githoney_fee_amount),
    )

  let maintainer_pay_output =
    Output {
      address: mocks.mk_maintainer_address(),
      value: from_lovelace(min_ada),
      datum: NoDatum,
      reference_script: None,
    }

  let script_ctx =
    script_ctx
      |> change_script_output_datum(new_datum)
      |> change_output_value(0, script_output_value)
      |> change_input_value(0, script_input_value)
      |> add_extra_signature(mocks.admin_addr)
      |> add_output(maintainer_pay_output)

  !validations.merge(mocks.settings_nft_policy, input_datum, script_ctx)
}

test bad_address() {
  let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum =
    GithoneyDatum {
      ..datum,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  let new_datum = GithoneyDatum { ..input_datum, merged: True }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_input_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)
  let githoney_fee_amount = mocks.reward_amount * mocks.reward_fee / 10000
  let script_output_value =
    merge(
      script_output.value,
      from_asset(mocks.token_a_policy, mocks.token_a_name, -githoney_fee_amount),
    )

  let githoney_pay_output =
    Output {
      address: mocks.mk_githoney_address(),
      value: from_asset(
        mocks.token_a_policy,
        mocks.token_a_name,
        githoney_fee_amount,
      ),
      datum: NoDatum,
      reference_script: None,
    }

  let maintainer_pay_output =
    Output {
      address: mocks.mk_maintainer_address(),
      value: from_lovelace(min_ada),
      datum: NoDatum,
      reference_script: None,
    }

  let script_ctx =
    script_ctx
      |> change_script_output_datum(new_datum)
      |> change_output_value(0, script_output_value)
      |> change_input_value(0, script_input_value)
      |> add_extra_signature(mocks.admin_addr)
      |> add_output(maintainer_pay_output)
      |> add_output(githoney_pay_output)
      |> change_output_address(0, mocks.mk_contributor_address())

  !validations.merge(mocks.settings_nft_policy, input_datum, script_ctx)
}

test after_deadline() {
  let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum =
    GithoneyDatum {
      ..datum,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  let new_datum = GithoneyDatum { ..input_datum, merged: True }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_input_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)
  let githoney_fee_amount = mocks.reward_amount * mocks.reward_fee / 10000
  let script_output_value =
    merge(
      script_output.value,
      from_asset(mocks.token_a_policy, mocks.token_a_name, -githoney_fee_amount),
    )

  let githoney_pay_output =
    Output {
      address: mocks.mk_githoney_address(),
      value: from_asset(
        mocks.token_a_policy,
        mocks.token_a_name,
        githoney_fee_amount,
      ),
      datum: NoDatum,
      reference_script: None,
    }

  let maintainer_pay_output =
    Output {
      address: mocks.mk_maintainer_address(),
      value: from_lovelace(min_ada),
      datum: NoDatum,
      reference_script: None,
    }

  let script_ctx =
    script_ctx
      |> change_script_output_datum(new_datum)
      |> change_output_value(0, script_output_value)
      |> change_input_value(0, script_input_value)
      |> add_extra_signature(mocks.admin_addr)
      |> add_output(maintainer_pay_output)
      |> add_output(githoney_pay_output)
      |> change_script_upper_bound(datum.deadline + 1)

  !validations.merge(mocks.settings_nft_policy, input_datum, script_ctx)
}

test without_bounty_id_token() fail {
  let script_ctx = mk_transition_script_context(Merge)
  expect Some(script_input) = head(script_ctx.transaction.inputs)
  let datum: GithoneyDatum = to_githoney_datum(script_input.output.datum)
  let input_datum =
    GithoneyDatum {
      ..datum,
      contributor_wallet: Some(mocks.mk_contributor_wallet()),
    }
  let new_datum = GithoneyDatum { ..input_datum, merged: True }
  expect Some(script_output) = head(script_ctx.transaction.outputs)
  let script_input_value =
    script_output.value |> add(ada_policy_id, ada_asset_name, min_ada)
  let githoney_fee_amount = mocks.reward_amount * mocks.reward_fee / 10000
  let script_output_value =
    merge(
      script_output.value,
      from_asset(mocks.token_a_policy, mocks.token_a_name, -githoney_fee_amount),
    )

  let githoney_pay_output =
    Output {
      address: mocks.mk_githoney_address(),
      value: from_asset(
        mocks.token_a_policy,
        mocks.token_a_name,
        githoney_fee_amount,
      ),
      datum: NoDatum,
      reference_script: None,
    }

  let maintainer_pay_output =
    Output {
      address: mocks.mk_maintainer_address(),
      value: from_lovelace(min_ada),
      datum: NoDatum,
      reference_script: None,
    }

  let script_ctx =
    script_ctx
      |> change_script_output_datum(new_datum)
      |> change_output_value(0, script_output_value)
      |> change_input_value(0, script_input_value)
      |> add_extra_signature(mocks.admin_addr)
      |> add_output(maintainer_pay_output)
      |> add_output(githoney_pay_output)
      |> script_input_without_bounty_id_token()

  validations.merge(mocks.settings_nft_policy, input_datum, script_ctx)
}
