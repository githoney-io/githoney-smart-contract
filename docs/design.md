# GitHoney dApp Design

## Introduction

This document describes the technical design of the GitHoney dApp - the script UTxOs involved, the operations that take place during the bounty lifecycle, and the necessary validators and minting policies.

There will be a single `BountyUtxo` for each bounty, which will hold the reward assets deposited by the maintainers. A `ContributorToken` and a `ControlToken` will be minted and held in the `BountyUtxo` until a contributor takes the `ContributorToken`, representing their assignment to the bounty. The `ControlToken` ensures the correctness of the `BountyUtxo` datum.

## UTxOs specification

### BountyUtxo:

> #### Address
>
> - Parameterized on the `GitHoneyAddress`.
>
> #### Datum
>
> - maintainer: **PaymentPubKeyHash**
> - deadline: **POSIXTime**
> - repo_id: **String**
> - pull_request_number: **Int**
> - admin: **PaymentPubKeyHash**
> - merged: **Bool**
>
> #### Value
>
> - minAda
> - reward_assets: **MultiAsset**
> - `ContributorToken` (if not assigned)
> - `ControlToken`

## Transactions

### Create BountyUtxo:

This transaction creates a `BountyUtxo` locking the reward assets and minting a `ContributorToken` and a `ControlToken`. It sets the maintainer, deadline, repo_id, pull_request_number, admin, and merged (False) in the datum.

![createBounty diagram](img/createBounty.png)

### Add Reward:

Adds additional reward assets to an existing `BountyUtxo`.

![addReward diagram](img/addRewards.png)

### Assign Contributor:

Transfers the `ContributorToken` from the `BountyUtxo` to the contributor's address.

![assignContributor diagram](img/assignContributor.png)

### Close Bounty:

Returns the all the assets to the maintainer and burns the `ControlToken`.

![closeBounty diagram](img/close.png)

### Merge Bounty:

Pays to Githoney the reward assets times `BountyRewardFee`. Updates the merged field to True.

![mergeBounty diagram](img/merge.png)

### Claim Bounty:

Pays the contributor the remaining reward assets and burns the `ControlToken`.

![claimBounty diagram](img/claim.png)

## Validators & Minting Policies

### BountyValidator:

- Params: `PolicyID`.

#### _AddReward Redeemer_

- `BountyUtxo` output value includes input value plus additional reward assets.
- Datum doesn't change.

#### _AssignContributor Redeemer_

- `ContributorToken` is transferred from the `BountyUtxo` to the contributor's address.
- Reward assets don't change.
- Datum merged field must be False.

#### _CloseBounty Redeemer_

- `BountyUtxo` input.
- `ControlToken` is burnt.
- Reward assets are paid back to the maintainer.
- Datum Admin address is present in the signers.

#### _MergeBounty Redeemer_

- `BountyUtxo` input.
- Reward assets times `BountyRewardFee` are paid to the `GitHoneyAddress`.
- Datum Admin address is present in the signers.
- Datum merged field is updated to True.

#### _ClaimBounty Redeemer_

- `BountyUtxo` input.
- `ContributorToken` is present in the inputs.
- Remaining reward assets in utxo are payed to the contributor.

### mintingPolicy:

- Params: `BountyCreationFee`, `BountyRewardFee`, `BountyValidatorAddress`, `GitHoneyAddress`.

#### MINT:

- A single `ContributorToken` and `ControlToken` are minted.
- The minted tokens are paid to the `BountyValidatorAddress`.
- The datum of the `BountyUtxo` is checked for correctness.
- Datum merged field must be False.

#### BURN:

- `ContributorToken` and `ControlToken` are present in the input.
