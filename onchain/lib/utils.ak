use types.{VerificationKeyHash, GithoneyDatum, Wallet}
use aiken/transaction.{Transaction, ScriptContext, Datum, InlineDatum, Output, Input, Spend}
use aiken/transaction/value.{AssetName, PolicyId, Value, tokens}
use aiken/dict
use aiken/transaction/credential.{ScriptCredential}
use aiken/list
use aiken/option

pub const control_token_name: ByteArray = "controlToken"
pub const min_ada: Int = 2_000_000

pub fn is_signed_by(transaction: Transaction, vk: VerificationKeyHash) {
  list.has(transaction.extra_signatories, vk)
}

// Returns the minting information of a transaction.
pub fn get_minting_info(tx: Transaction) -> (PolicyId, AssetName, Int) {
  expect [info] = tx.mint |> value.from_minted_value |> value.flatten
  info
}

// Converts an arbitrary Data type into a GithoneyDatum.
pub fn to_githoney_datum(data: Data) -> GithoneyDatum {
  expect InlineDatum(datum): Datum = data
  expect datum: GithoneyDatum = datum
  datum
}

pub fn get_first_output(ctx: ScriptContext) -> Output {
  expect Some(capsule_utxo) = ctx.transaction.outputs |> list.head
  capsule_utxo
}

// Verifies if an input UTxO belongs to a script.
pub fn is_script_utxo(input: Input) -> Bool {
  when input.output.address.payment_credential is {
    ScriptCredential(_) ->
      True
    _ ->
      False
  }
}

pub fn get_script_input(ctx: ScriptContext) -> Input {
  expect Spend(my_output_reference) = ctx.purpose
  expect Some(input) = ctx.transaction.inputs
    |> transaction.find_input(my_output_reference)
  input
}

// Returns the total value paid to an address by a pending transaction.
pub fn value_paid_to(wallet: Wallet, tx: Transaction) -> Value {
  let Wallet { payment_key, stake_key } = wallet
  let address = when stake_key is {
    None ->
      credential.from_verification_key(payment_key)
    Some(stake_k) ->
      credential.from_verification_key(payment_key)
        |> credential.with_delegation_key(stake_k)
  }

  list.reduce(
    tx.outputs,
    value.zero(),
    fn(acc, output) {
      if output.address == address {
        value.merge(acc, output.value)
      } else {
        acc
      }
    },
  )
}

pub fn get_input_with_asset(
  inputs: List<Input>,
  policy_id: PolicyId,
  asset_name: AssetName,
) {
  expect [input] = list.filter(
    inputs,
    fn(inp) {
      let quantity = tokens(inp.output.value, policy_id)
        |> dict.get(key: asset_name)
        |> option.or_else(0)
      quantity > 0
    },
  )
  input
}



