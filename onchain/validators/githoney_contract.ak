use aiken/collection/dict
use aiken/collection/list
use aiken/option.{is_none, is_some}
use cardano/address.{Address, Script, from_script}
use cardano/assets.{
  PolicyId, flatten, from_asset_list, from_lovelace, lovelace_of, match,
  quantity_of, tokens,
}
use cardano/transaction.{
  Datum, InlineDatum, OutputReference, Redeemer, Transaction,
}
use checks.{
  is_assign_datum_valid, is_merge_datum_valid, is_signed_by,
  is_tx_before_deadline, is_utxo_datum_valid, is_utxo_value_valid,
  reference_input_settings_with_NFT, utxo_at_paid_to_address,
}
use types.{
  AddRewards, Assign, Claim, Close, CloseSettings, GithoneyContractRedeemers,
  GithoneyDatum, Merge, SettingsDatum, SettingsRedeemers, UpdateSettings,
}
use utils.{
  get_minting_info, get_unique_script_input, max_amount_of_tokens_admiteed,
  merge_payments_parts, min_ada, settings_token_name, to_githoney_datum,
  value_greater_than, value_greater_than_or_equal,
}

validator githoney(settings_policy_id: PolicyId) {
  spend(
    datum: Option<GithoneyDatum>,
    redeemer: GithoneyContractRedeemers,
    _input_ref: OutputReference,
    tx: Transaction,
  ) {
    expect Some(datum) = datum

    let script_input = get_unique_script_input(tx.inputs).output
    expect Script(bounty_id_policy) = script_input.address.payment_credential
    expect [Pair(bounty_id_name, 1)] =
      // expect only one bounty token id
      script_input.value |> tokens(bounty_id_policy) |> dict.to_pairs

    when redeemer is {
      AddRewards -> {
        let script_output =
          utxo_at_paid_to_address(tx.outputs, script_input.address, 0)
        let new_datum = to_githoney_datum(script_output.datum)

        let is_tx_before_deadline =
          is_tx_before_deadline(tx.validity_range, datum.deadline)
        let is_datum_the_same = datum == new_datum
        let is_value_grater_than_before =
          value_greater_than(script_output.value, script_input.value)
        let is_datum_not_merged = !datum.merged
        let are_policies_less_than =
          list.length(flatten(script_output.value)) <= max_amount_of_tokens_admiteed

        is_datum_not_merged? && is_datum_the_same? && is_tx_before_deadline? && is_value_grater_than_before? && are_policies_less_than?
      }
      Assign -> {
        let script_output =
          utxo_at_paid_to_address(tx.outputs, script_input.address, 0)
        let new_datum = to_githoney_datum(script_output.datum)

        let is_tx_before_deadline =
          is_tx_before_deadline(tx.validity_range, datum.deadline)
        let contributor_isnt_assigned = is_none(datum.contributor_address)
        let is_new_datum_valid = is_assign_datum_valid(datum, new_datum)
        let expected_value =
          assets.merge(script_input.value, from_lovelace(min_ada))
        let is_utxo_value_valid = match(script_output.value, expected_value, ==)

        is_new_datum_valid? && is_utxo_value_valid? && is_tx_before_deadline? && contributor_isnt_assigned?
      }
      Merge -> {
        let settings_datum =
          reference_input_settings_with_NFT(tx, settings_policy_id)
        let script_output =
          utxo_at_paid_to_address(tx.outputs, script_input.address, 0)
        let githoney_output =
          utxo_at_paid_to_address(
            tx.outputs,
            settings_datum.githoney_address,
            1,
          )
        let maintainer_output =
          utxo_at_paid_to_address(tx.outputs, datum.maintainer_address, 2)
        let new_datum = to_githoney_datum(script_output.datum)

        let is_tx_before_deadline =
          is_tx_before_deadline(tx.validity_range, datum.deadline)
        let contributor_is_assigned = is_some(datum.contributor_address)
        let is_new_datum_valid = is_merge_datum_valid(datum, new_datum)
        let (script_value, githoney_value) =
          merge_payments_parts(
            datum.bounty_reward_fee,
            script_input.value,
            bounty_id_policy,
            bounty_id_name,
          )
        let is_utxo_value_valid = match(script_output.value, script_value, ==)
        let is_reward_fee_paid =
          value_greater_than_or_equal(githoney_output.value, githoney_value)
        let is_signed_by_admin =
          is_signed_by(tx.extra_signatories, datum.admin_payment_credential)
        let is_maintainer_minada_paid =
          value_greater_than_or_equal(
            maintainer_output.value,
            from_lovelace(min_ada),
          )
        let is_datum_not_merged = !datum.merged

        is_datum_not_merged? && is_signed_by_admin? && is_new_datum_valid? && is_utxo_value_valid? && is_tx_before_deadline? && contributor_is_assigned? && is_maintainer_minada_paid? && is_reward_fee_paid?
      }
      Close -> {
        let (policy_id, minted_name, minted_quantity) = get_minting_info(tx)
        let maintainer_output =
          utxo_at_paid_to_address(tx.outputs, datum.maintainer_address, 0)

        let is_maintainer_pay_valid =
          value_greater_than_or_equal(
            maintainer_output.value,
            from_asset_list(datum.initial_value),
          )
        let are_payments_valid =
          when datum.contributor_address is {
            Some(contributor_address) -> {
              let contributor_output =
                utxo_at_paid_to_address(tx.outputs, contributor_address, 1)
              let is_contributor_pay_valid =
                value_greater_than_or_equal(
                  contributor_output.value,
                  from_lovelace(min_ada),
                )
              is_contributor_pay_valid? && is_maintainer_pay_valid?
            }

            None -> is_maintainer_pay_valid?
          }

        let is_signed_by_admin =
          is_signed_by(tx.extra_signatories, datum.admin_payment_credential)
        let is_bounty_id_token_burnt =
          minted_quantity == -1 && minted_name == bounty_id_name && policy_id == bounty_id_policy
        let is_datum_not_merged = !datum.merged

        is_datum_not_merged? && is_signed_by_admin? && are_payments_valid? && is_bounty_id_token_burnt?
      }
      Claim -> {
        expect Some(contributor_address) = datum.contributor_address
        let contributor_utxo =
          utxo_at_paid_to_address(tx.outputs, contributor_address, 0)

        let (policy_id, minted_name, minted_quantity) = get_minting_info(tx)
        let is_contributor_pay_valid =
          value_greater_than_or_equal(
            contributor_utxo.value,
            script_input.value
              |> assets.add(bounty_id_policy, bounty_id_name, -1),
          )
        let is_bounty_id_token_burnt =
          minted_quantity == -1 && minted_name == bounty_id_name && policy_id == bounty_id_policy

        datum.merged? && is_bounty_id_token_burnt? && is_contributor_pay_valid?
      }
    }
  }

  mint(_redeemer: Redeemer, _minting_policy: PolicyId, tx: Transaction) {
    let (own_policy, bounty_id, minted_quantity) = get_minting_info(tx)
    if minted_quantity == -1 {
      True
    } else {
      let settings_datum =
        reference_input_settings_with_NFT(tx, settings_policy_id)
      let script_output =
        utxo_at_paid_to_address(tx.outputs, from_script(own_policy), 0)
      let githoney_output =
        utxo_at_paid_to_address(tx.outputs, settings_datum.githoney_address, 1)
      let datum = to_githoney_datum(script_output.datum)

      let is_minting_only_one_bounty_id_token = minted_quantity == 1

      let is_creation_fee_paid =
        lovelace_of(githoney_output.value) >= settings_datum.bounty_creation_fee

      let valid_datum =
        is_utxo_datum_valid(settings_datum.bounty_reward_fee, tx, datum)
      let valid_value =
        is_utxo_value_valid(own_policy, bounty_id, script_output.value)

      let valid_deposit =
        match(
          from_asset_list(datum.initial_value),
          script_output.value
            |> assets.add(own_policy, bounty_id, -1),
          ==,
        )

      is_creation_fee_paid? && is_minting_only_one_bounty_id_token? && valid_datum? && valid_value? && valid_deposit?
    }
  }

  else(_) {
    fail
  }
}

validator settings {
  spend(
    datum: Option<SettingsDatum>,
    redeemer: SettingsRedeemers,
    _input_ref: OutputReference,
    tx: Transaction,
  ) {
    expect Some(datum) = datum
    let script_input = get_unique_script_input(tx.inputs).output
    expect [(settings_policy, _, 1)] =
      script_input.value
        |> assets.without_lovelace()
        |> assets.flatten()

    let is_signed =
      is_signed_by(
        tx.extra_signatories,
        datum.githoney_address.payment_credential,
      )

    when redeemer is {
      UpdateSettings -> {
        let script_output =
          utxo_at_paid_to_address(tx.outputs, script_input.address, 0)
        expect [(settings_policy_output, _, 1)] =
          script_output.value
            |> assets.without_lovelace()
            |> assets.flatten()
        let is_settings_policy_in_output =
          settings_policy_output == settings_policy

        expect InlineDatum(new_datum) = script_output.datum
        expect _settings_datum: SettingsDatum = new_datum

        is_signed? && is_settings_policy_in_output?
      }
      CloseSettings -> {
        let (policy_id, minted_name, minted_quantity) = get_minting_info(tx)

        let is_settings_policy_burnt =
          minted_quantity == -1 && minted_name == settings_token_name && policy_id == settings_policy

        is_settings_policy_burnt? && is_signed?
      }
    }
  }

  else(_) {
    fail
  }
}

validator settings_minting(
  utxo_ref: OutputReference,
  settings_script_addr: Address,
) {
  mint(_redeemer: Redeemer, settings_policy: PolicyId, tx: Transaction) {
    let (_, _, minted_quantity) = get_minting_info(tx)

    let is_token_burned = minted_quantity == -1
    if is_token_burned {
      True
    } else {
      let is_minting_only_one_setting_token = minted_quantity == 1
      let is_outref_in_inputs =
        list.any(tx.inputs, fn(input) { input.output_reference == utxo_ref })

      let script_output =
        utxo_at_paid_to_address(tx.outputs, settings_script_addr, 0)

      expect InlineDatum(datum) = script_output.datum
      expect _settings_datum: SettingsDatum = datum

      let is_setting_token_in_output =
        quantity_of(script_output.value, settings_policy, settings_token_name) == 1

      is_minting_only_one_setting_token? && is_outref_in_inputs? && is_setting_token_in_output?
    }
  }

  else(_) {
    fail
  }
}

validator badges_policy(utxo_ref: OutputReference, nonce: Int) {
  mint(_redeemer: Redeemer, _minting_policy: PolicyId, tx: Transaction) {
    let is_outref_in_inputs =
      list.any(tx.inputs, fn(input) { input.output_reference == utxo_ref })

    let is_valid_nonce = nonce >= 0

    is_outref_in_inputs? && is_valid_nonce?
  }

  else(_) {
    fail
  }
}

validator badges_contract(settings_policy_id: PolicyId) {
  spend(
    _datum: Option<Datum>,
    _redeemer: Redeemer,
    _input_ref: OutputReference,
    tx: Transaction,
  ) {
    let settings_datum =
      reference_input_settings_with_NFT(tx, settings_policy_id)
    let is_signed_by_githoney =
      is_signed_by(
        tx.extra_signatories,
        settings_datum.githoney_address.payment_credential,
      )
    is_signed_by_githoney
  }

  else(_) {
    fail
  }
}
