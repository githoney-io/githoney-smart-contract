use aiken/dict
use aiken/list.{length}
use aiken/option.{is_none, is_some}
use aiken/transaction.{Output, OutputReference, ScriptContext, Transaction}
use aiken/transaction/credential.{ScriptCredential, from_script}
use aiken/transaction/value.{
  AssetName, PolicyId, ada_asset_name, ada_policy_id, from_lovelace, quantity_of,
  tokens,
}
use checks.{
  is_assign_datum_valid, is_merge_datum_valid, is_signed_by,
  is_tx_before_deadline, is_utxo_datum_valid, is_utxo_value_valid,
}
use types.{GithoneyDatum, SettingsDatum}
use utils.{
  get_first_output, get_minting_info, get_script_input, merge_payments_parts,
  min_ada, settings_token_name, to_githoney_datum, to_settings_datum,
  value_grater_than, value_grater_than_or_equal, value_paid_to,
}

pub fn reference_input_settings_with_NFT(
  tx: Transaction,
  settings_policy_id: PolicyId,
) -> SettingsDatum {
  expect [ref_input] = tx.reference_inputs
  let has_settings_nft =
    quantity_of(ref_input.output.value, settings_policy_id, settings_token_name) == 1
  if !has_settings_nft {
    fail @"There should be exactly one settings NFT in the reference input"
  } else {
    to_settings_datum(ref_input.output.datum)
  }
}

pub fn script_input_and_token_id_info(
  ctx: ScriptContext,
) -> (Output, PolicyId, AssetName) {
  let script_input = get_script_input(ctx).output
  expect ScriptCredential(bounty_id_policy) =
    script_input.address.payment_credential
  expect [bounty_id_name] =
    script_input.value |> tokens(bounty_id_policy) |> dict.keys
  let is_there_one_bounty_id =
    quantity_of(script_input.value, bounty_id_policy, bounty_id_name) == 1
  if !is_there_one_bounty_id {
    fail @"There should be exactly one bounty id token in the inputs"
  } else {
    (script_input, bounty_id_policy, bounty_id_name)
  }
}

pub fn add_rewards(datum: GithoneyDatum, ctx: ScriptContext) -> Bool {
  let (script_input, _, _) = script_input_and_token_id_info(ctx)
  let script_output = get_first_output(ctx)
  let new_datum = to_githoney_datum(script_output.datum)

  let is_tx_before_deadline =
    is_tx_before_deadline(ctx.transaction, datum.deadline)
  let is_datum_the_same = datum == new_datum
  let is_value_grater_than_before =
    value_grater_than(script_output.value, script_input.value)
  let is_utxo_address_the_same = script_input.address == script_output.address

  is_datum_the_same? && is_tx_before_deadline? && is_utxo_address_the_same? && is_value_grater_than_before?
}

pub fn assign(datum: GithoneyDatum, ctx: ScriptContext) -> Bool {
  let (script_input, _, _) = script_input_and_token_id_info(ctx)
  let script_output = get_first_output(ctx)
  let new_datum = to_githoney_datum(script_output.datum)

  let is_tx_before_deadline =
    is_tx_before_deadline(ctx.transaction, datum.deadline)
  let contributor_isnt_assigned = is_none(datum.contributor_wallet)
  let is_new_datum_valid = is_assign_datum_valid(datum, new_datum)
  let is_utxo_address_the_same = script_input.address == script_output.address
  let expected_value = value.merge(script_input.value, from_lovelace(min_ada))
  let is_utxo_value_valid = script_output.value == expected_value

  is_new_datum_valid? && is_utxo_value_valid? && is_tx_before_deadline? && is_utxo_address_the_same? && contributor_isnt_assigned?
}

pub fn merge(
  settings_policy_id: PolicyId,
  datum: GithoneyDatum,
  ctx: ScriptContext,
) -> Bool {
  let settings_datum =
    reference_input_settings_with_NFT(ctx.transaction, settings_policy_id)
  let (script_input, bounty_id_policy, bounty_id_name) =
    script_input_and_token_id_info(ctx)
  let script_output = get_first_output(ctx)
  let new_datum = to_githoney_datum(script_output.datum)
  let min_ada_value = from_lovelace(min_ada)

  let is_tx_before_deadline =
    is_tx_before_deadline(ctx.transaction, datum.deadline)
  let contributor_is_assigned = is_some(datum.contributor_wallet)
  let is_new_datum_valid = is_merge_datum_valid(datum, new_datum)
  let is_utxo_address_the_same = script_input.address == script_output.address
  let (script_value, githoney_value) =
    merge_payments_parts(
      datum.bounty_reward_fee,
      script_input.value,
      bounty_id_policy,
      bounty_id_name,
    )
  let is_utxo_value_valid = script_output.value == script_value
  let is_reward_fee_payed =
    value_grater_than_or_equal(
      value_paid_to(settings_datum.githoney_wallet, ctx.transaction),
      githoney_value,
    )
  let is_signed_by_admin =
    is_signed_by(ctx.transaction, datum.admin_wallet.payment_key)
  let is_maintainer_minada_payed =
    value_paid_to(datum.maintainer_wallet, ctx.transaction) == min_ada_value
  let is_datum_not_merged = !datum.merged

  is_datum_not_merged? && is_signed_by_admin? && is_new_datum_valid? && is_utxo_value_valid? && is_tx_before_deadline? && contributor_is_assigned? && is_utxo_address_the_same? && is_maintainer_minada_payed? && is_reward_fee_payed?
}

pub fn close(datum: GithoneyDatum, ctx: ScriptContext) -> Bool {
  let (script_input, bounty_id_policy, bounty_id_name) =
    script_input_and_token_id_info(ctx)
  let (policy_id, minted_name, minted_quantity) =
    get_minting_info(ctx.transaction)
  let are_payments_valid =
    when datum.contributor_wallet is {
      Some(contributor_wallet) -> {
        let is_contributor_pay_valid =
          value_paid_to(contributor_wallet, ctx.transaction) == from_lovelace(
            min_ada,
          )
        let is_maintainer_pay_valid =
          value_paid_to(datum.maintainer_wallet, ctx.transaction) == (
            script_input.value
              |> value.add(ada_policy_id, ada_asset_name, -min_ada)
              |> value.add(bounty_id_policy, bounty_id_name, -1)
          )
        is_contributor_pay_valid? && is_maintainer_pay_valid?
      }
      None -> {
        let is_maintainer_pay_valid =
          value_paid_to(datum.maintainer_wallet, ctx.transaction) == (
            script_input.value
              |> value.add(bounty_id_policy, bounty_id_name, -1)
          )
        is_maintainer_pay_valid?
      }
    }

  let is_signed_by_admin =
    is_signed_by(ctx.transaction, datum.admin_wallet.payment_key)
  let is_bounty_id_token_burnt =
    minted_quantity == -1 && minted_name == bounty_id_name && policy_id == bounty_id_policy
  let is_datum_not_merged = !datum.merged

  is_datum_not_merged? && is_signed_by_admin? && are_payments_valid? && is_bounty_id_token_burnt?
}

pub fn claim(datum: GithoneyDatum, ctx: ScriptContext) -> Bool {
  let (script_input, bounty_id_policy, bounty_id_name) =
    script_input_and_token_id_info(ctx)
  expect Some(contributor_wallet) = datum.contributor_wallet

  let (policy_id, minted_name, minted_quantity) =
    get_minting_info(ctx.transaction)
  let is_contributor_pay_valid =
    value_grater_than_or_equal(
      value_paid_to(contributor_wallet, ctx.transaction),
      script_input.value
        |> value.add(bounty_id_policy, bounty_id_name, -1),
    )
  let is_bounty_id_token_burnt =
    minted_quantity == -1 && minted_name == bounty_id_name && policy_id == bounty_id_policy

  datum.merged? && is_bounty_id_token_burnt? && is_contributor_pay_valid?
}

// Main validation of the githoney token minting policy
pub fn minting_policy(settings_policy_id: PolicyId, ctx: ScriptContext) -> Bool {
  let settings_datum =
    reference_input_settings_with_NFT(ctx.transaction, settings_policy_id)
  let (own_policy, _, minted_quantity) = get_minting_info(ctx.transaction)

  let is_token_burned = minted_quantity == -1
  if is_token_burned {
    True
  } else {
    let script_output = get_first_output(ctx)
    let datum = to_githoney_datum(script_output.datum)

    let is_minting_only_one_bounty_id_token = minted_quantity == 1

    let is_script_output_address_valid =
      script_output.address == from_script(own_policy)
    let is_creation_fee_paid =
      value_paid_to(settings_datum.githoney_wallet, ctx.transaction) == from_lovelace(
        settings_datum.bounty_creation_fee,
      )

    let valid_datum =
      is_utxo_datum_valid(
        settings_datum.bounty_reward_fee,
        ctx.transaction,
        datum,
      )
    let valid_value = is_utxo_value_valid(own_policy, script_output.value)

    is_creation_fee_paid? && is_minting_only_one_bounty_id_token? && is_script_output_address_valid? && valid_datum? && valid_value?
  }
}

// Settings Validation
pub fn update_settings(datum: SettingsDatum, ctx: ScriptContext) -> Bool {
  let script_input = get_script_input(ctx).output
  expect [(settings_nft_policy, settings_token_name, _)] =
    script_input.value
      |> value.without_lovelace()
      |> value.flatten()

  let is_signed =
    is_signed_by(ctx.transaction, datum.githoney_wallet.payment_key)

  let is_only_one_token_input =
    length(script_input.value |> value.policies) == 2 && quantity_of(
      script_input.value,
      settings_nft_policy,
      settings_token_name,
    ) == 1

  let script_output = get_first_output(ctx)
  let is_settings_nft_in_output =
    quantity_of(script_input.value, settings_nft_policy, settings_token_name) == 1

  let new_datum = to_settings_datum(script_output.datum)

  is_signed? && is_only_one_token_input? && is_settings_nft_in_output?
}

pub fn close_settings(datum: SettingsDatum, ctx: ScriptContext) -> Bool {
  let script_input = get_script_input(ctx).output
  expect [(settings_nft_policy, settings_token_name, _)] =
    script_input.value
      |> value.without_lovelace()
      |> value.flatten()

  let (policy_id, minted_name, minted_quantity) =
    get_minting_info(ctx.transaction)

  let is_settings_nft_burnt =
    minted_quantity == -1 && minted_name == settings_token_name && policy_id == settings_nft_policy

  let is_signed =
    is_signed_by(ctx.transaction, datum.githoney_wallet.payment_key)
  let is_githoney_pay_valid =
    value_paid_to(datum.githoney_wallet, ctx.transaction) == (
      script_input.value
        |> value.add(settings_nft_policy, settings_token_name, -1)
    )
  is_settings_nft_burnt? && is_signed? && is_githoney_pay_valid?
}

pub fn minting_policy_settings(
  utxo_ref: OutputReference,
  ctx: ScriptContext,
) -> Bool {
  let (settings_nft, _, minted_quantity) = get_minting_info(ctx.transaction)

  let is_token_burned = minted_quantity == -1
  if is_token_burned {
    True
  } else {
    let is_minting_only_one_setting_token = minted_quantity == 1

    let is_utxo_in_script_input =
      list.any(
        ctx.transaction.inputs,
        fn(input) { input.output_reference == utxo_ref },
      )

    let script_output = get_first_output(ctx)
    let datum = to_settings_datum(script_output.datum)
    expect [setting_token_name] =
      script_output.value |> tokens(settings_nft) |> dict.keys
    let is_setting_token_in_output =
      quantity_of(script_output.value, settings_nft, setting_token_name) == 1

    is_minting_only_one_setting_token? && is_utxo_in_script_input? && is_setting_token_in_output?
  }
}
