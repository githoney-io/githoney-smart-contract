# GitHoney dApp Design

## Introduction

This document describes the technical design of the GitHoney dApp - the script UTxOs involved, the operations that take place during the bounty lifecycle, and the necessary validators and minting policies.

There will be a single `BountyUtxo` for each bounty, holding the reward assets deposited by the maintainers. A `ControlToken` will be minted and held in the `BountyUtxo` during the bounty creation. Initially, the contributor field in the datum will be null until a developer decides to work on that bounty, at which point their `PaymentPubKeyHash` will be added to the datum. The `ControlToken` ensures the correctness of the `BountyUtxo` datum, the initial payment of the bounty creation fee to GitHoney, and also that the reward assets are not null. The presence of the `ControlToken` within a UTxO held at the validator address will serve as proof that the UTxO is a `BountyUtxo`.
**Multivalidators** will be utilized, meaning both scripts share the same parameters. Consequently, the script address and the minting policy ID are identical. This enables identification of the policy ID of the `ControlToken` within the validator and the validator address within the minting policy.

## UTxOs Specification

### BountyUtxo

> #### Address
>
> - Parameterized on the `GitHoneyAddress`, `BountyCreationFee`, and `BountyRewardFee`.
>
> #### Datum
>
> - admin: **PaymentPubKeyHash**
> - maintainer: **PaymentPubKeyHash**
> - contributor: **Optional(PaymentPubKeyHash)** (if assigned)
> - bounty_id: **String**
> - deadline: **POSIXTime**
> - merged: **Bool**
>
> #### Value
>
> - minAda
> - reward_assets
> - `ControlToken`

### ControlToken

The `ControlToken` is a minted token that is used to validate the `BountyUtxo` and ensure the correctness of the datum.

## Transactions

### Create BountyUtxo

This transaction creates a `BountyUtxo` locking the reward assets plus min ADA and a `ControlToken`. It sets the maintainer, deadline, bounty*id, admin, and merged (\_set to False*) in the datum.

```typescript
/**
 * Builds a `createBounty` transaction. The tx is built in the context of the maintainer wallet.
 * @param maintainerAddr The maintainer's address.
 * @param adminAddr The admin's address.
 * @param reward The reward asset and amount to be locked in the bounty UTxO.
 * @param deadline The deadline for the bounty.
 * @param bounty_id The bounty identifier.
 * @param lucid Lucid instance.
 * @returns The cbor of the unsigned transaction.
 */
async function createBounty(
  maintainerAddr: string,
  adminAddr: string,
  reward: { unit: string; amount: bigint },
  deadline: bigint,
  bounty_id: string,
  lucid: Lucid
): Promise<string>;
```

![createBounty diagram](img/createBounty.png "Create Bounty Tx")

### Add Reward

Adds additional reward assets to an existing `BountyUtxo`.

```typescript
/**
 * Builds an `addReward` transaction. The tx is built in the context of any wallet.
 * @param utxoRef The reference of the last transaction output that contains the bounty UTxO.
 * @param address The address of the current wallet.
 * @param reward The reward asset and amount to be added.
 * @param lucid Lucid instance.
 * @returns The cbor of the unsigned transaction.
 */
async function addRewards(
  utxoRef: OutRef,
  address: string,
  reward: { unit: string; amount: bigint },
  lucid: Lucid
): Promise<string>;
```

![addReward diagram](img/addRewards.png "Add Reward Tx")

### Assign Contributor

Sets the contributor's `PaymentPubKeyHash` to the `BountyUtxo` datum and adds the contributor's min ADA to the value.

```typescript
/**
 * Builds an `assignContributor` transaction. The tx is built in the context of the contributor wallet.
 * @param utxoRef The reference of the last transaction output that contains the bounty UTxO.
 * @param contributorAddr The contributor's address.
 * @param lucid Lucid instance.
 * @returns The cbor of the unsigned transaction.
 */
async function assignContributor(
  utxoRef: OutRef,
  contributorAddr: string,
  lucid: Lucid
): Promise<string>;
```

![assignContributor diagram](img/assignContributor.png "Assign Contributor Tx")

### Close Bounty

The admin closes the bounty, returning the reward assets to the maintainer and burning the `ControlToken`. If a contributor is assigned, the min ADA is returned to them.

```typescript
/**
 * Builds a `closeBounty` transaction. The tx is built in the context of the admin wallet.
 * @param lucid Lucid instance.
 * @param utxoRef The reference of the last transaction output that contains the bounty UTxO.
 * @returns The cbor of the unsigned transaction.
 */
async function closeBounty(utxoRef: OutRef, lucid: Lucid): Promise<string>;
```

#### Close Bounty Before Contributor Assignment

![closeBounty diagram](img/close1.png "Close Bounty Before Contributor Assignment Tx")

#### Close Bounty After Contributor Assignment

![closeBountyAfterContributor diagram](img/close2.png "Close Bounty After Contributor Assignment Tx")

### Merge Bounty

Pays GitHoney the reward assets multiplied by the `BountyRewardFee`. Updates the merged field to _True_. The contributor's min ADAs remain in the UTxO.

```typescript
/**
 * Builds a `mergeBounty` transaction. The tx is built in the context of the admin wallet.
 * @param utxoRef The reference of the last transaction output that contains the bounty UTxO.
 * @param lucid Lucid instance.
 * @returns The cbor of the unsigned transaction.
 */
async function mergeBounty(ref_input: OutRef, lucid: Lucid): Promise<string>;
```

![mergeBounty diagram](img/merge.png "Merge Bounty Tx")

### Claim Bounty

Pays the contributor the remaining reward assets and burns the `ControlToken`.

```typescript
/**
 * Builds a `claimBounty` transaction. The tx is built in the context of the contributor wallet.
 * @param utxoRef The reference of the last transaction output that contains the bounty UTxO.
 * @param lucid Lucid instance.
 * @param contributorAdrr The contributor's address.
 * @returns The cbor of the unsigned transaction.
 */
async function claimBounty(
  utxoRef: OutRef,
  lucid: Lucid,
  contributorAddr: string
): Promise<string>;
```

![claimBounty diagram](img/claim.png "Claim Bounty Tx")

## Validators & Minting Policies

### BountyValidator

- Params: `GitHoneyAddress`, `BountyCreationFee`, and `BountyRewardFee`.

#### _AddReward Redeemer_

- `BountyUtxo` input with a control token.
- The `deadline` has not been reached.
- `BountyUtxo` output value includes the input value plus additional reward assets.
- Datum doesn't change.

#### _AssignContributor Redeemer_

- `BountyUtxo` input with a control token.
- The `deadline` has not been reached.
- The `contributor` field in the datum is null.
- Contributor's `PaymentPubKeyHash` is added to the `BountyUtxo` datum, and the rest of the datum fields are the same.
- UTxO assets are the same plus min ADAs.

#### _CloseBounty Redeemer_

- `BountyUtxo` input with a control token.
- `ControlToken` is burnt.
- The merged field is False.
- Reward assets and the min ADAs are paid back to the maintainer.
- If the `contributor` is setted the min ADAs are paid back to the contributor.
- Datum Admin address signed the transaction.

#### _MergeBounty Redeemer_

- `BountyUtxo` input with a control token.
- The merged field is False.
- The `deadline` has not passed.
- There is a contributor assigned.
- Reward assets times `BountyRewardFee` is paid to the `GitHoneyAddress`, the min ADAs are paid back to the maintainer, and the rest of the assets remain in the UTxO.
- Datum Admin address signed the transaction.
- Datum merged field is updated to True, and the rest of the datum fields are the same.

#### _ClaimBounty Redeemer_

- `BountyUtxo` input with a control token.
- The merged field is True.
- `ControlToken` is burnt.
- The remaining reward assets in UTxO are paid to the `contributor`'s `PaymentPubKeyHash`.

### mintingPolicy

- Params: `BountyCreationFee`, `BountyRewardFee`, `GitHoneyAddress`.

#### MINT

- A single `ControlToken` is minted.
- The minted token and the min ADAs are paid to the `BountyValidatorAddress`.
- There are some reward assets paid to the `BountyUtxo`.
- The datum of the `BountyUtxo` is checked for correctness:
- Deadline must be in the future.
- Merged field must be False.
- Contributor field must be null.

#### BURN

- There are no script outputs.
