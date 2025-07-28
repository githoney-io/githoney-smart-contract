import { describe, expect, it } from "@jest/globals";
import { OutRef } from "@spacebudz/lucid";
import {
  bountyId,
  logger,
  newAssign,
  newBounty,
  newClaim,
  newMerge,
  waitForUtxosUpdate,
} from "../utils";
import { createBounty, addReward, updateSettings } from "../../operations";
import { lucidBase, signAndSubmit } from "../../utils/utils";
import {
  adminAddr,
  adminSeed,
  githoneyAddr,
  maintainerAddr,
  settingsRef,
  sponsorSeed,
  sponsorAddr,
} from "../../constants";

describe("Add Rewards tests", async () => {
  it("Add Rewards with same token", async () => {
    const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

    const createTxHash = await newBounty(lucidBase, settingsUtxo);
    const createOutRef: OutRef = { txHash: createTxHash, outputIndex: 0 };

    const additionalRewardAmount = 500n;
    const { addRewardCbor } = await addReward(
      additionalRewardAmount,
      settingsUtxo,
      sponsorAddr,
      createOutRef,
    );
    console.log("Add Rewards transaction CBOR:", addRewardCbor);
    const lucidAddReward = lucidBase.selectWalletFromSeed(sponsorSeed);
    await signAndSubmit(addRewardCbor, lucidAddReward);
  });

  it("Add Rewards with lovelace", async () => {
    const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);
    const now = new Date();
    const deadline = new Date(
      now.getTime() + 1000 * 60 * 60 * 24 * 2,
    ).getTime();

    const { createCbor } = await createBounty(
      githoneyAddr,
      "lovelace",
      "",
      10n,
      bountyId,
      maintainerAddr,
      adminAddr,
      settingsUtxo,
      BigInt(deadline),
    );

    const createTxHash = await signAndSubmit(createCbor);
    waitForUtxosUpdate(lucidBase, createTxHash);
    const bountyOutRef: OutRef = { txHash: createTxHash, outputIndex: 0 };

    const additionalRewardAmount = 5n;
    const { addRewardCbor } = await addReward(
      additionalRewardAmount,
      settingsUtxo,
      sponsorAddr,
      bountyOutRef,
    );

    const lucidAddReward = lucidBase.selectWalletFromSeed(sponsorSeed);
    await signAndSubmit(addRewardCbor, lucidAddReward);
  });

  it("Add Rewards with already merged bounty", async () => {
    const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

    try {
      const createTxId = await newBounty(lucidBase, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucidBase, createOutRef, settingsUtxo);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      const mergeTxId = await newMerge(lucidBase, assignOutRef, settingsUtxo);
      const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

      const additionalRewardAmount = 100n;
      await addReward(
        additionalRewardAmount,
        settingsUtxo,
        sponsorAddr,
        mergeOutRef,
      );
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toBe("Bounty already merged");
    }
  });
});

describe("Reward bounds", async () => {
  it("0 reward fee", async () => {
    const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

    const newSettings = {
      creationFee: 2000000n,
      rewardFee: 0n,
    };
    // Update settings with 0 reward fee
    const { updateCbor } = await updateSettings(settingsUtxo, newSettings);
    const lucidAdmin = lucidBase.selectWalletFromSeed(adminSeed);
    const updateTxHash = await signAndSubmit(updateCbor, lucidAdmin);
    waitForUtxosUpdate(lucidAdmin, updateTxHash);

    const [newSettingsUtxo] = await lucidBase.utxosByOutRef([
      { txHash: updateTxHash, outputIndex: 0 },
    ]);

    const createTxId = await newBounty(lucidBase, newSettingsUtxo);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTxId = await newAssign(
      lucidBase,
      createOutRef,
      newSettingsUtxo,
    );
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const mergeTxId = await newMerge(lucidBase, assignOutRef, newSettingsUtxo);
    const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

    await newClaim(lucidBase, mergeOutRef, newSettingsUtxo);
  });

  it("10000 reward fee", async () => {
    const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

    const newSettings = {
      creationFee: 2000000n,
      rewardFee: 1000n,
    };
    // Update settings with 10000 reward fee
    const { updateCbor } = await updateSettings(settingsUtxo, newSettings);

    const lucidAdmin = lucidBase.selectWalletFromSeed(adminSeed);
    const updateTxHash = await signAndSubmit(updateCbor, lucidAdmin);
    waitForUtxosUpdate(lucidAdmin, updateTxHash);
    const [newSettingsUtxo] = await lucidBase.utxosByOutRef([
      { txHash: updateTxHash, outputIndex: 0 },
    ]);

    const createTxId = await newBounty(lucidBase, newSettingsUtxo);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTxId = await newAssign(
      lucidBase,
      createOutRef,
      newSettingsUtxo,
    );
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const mergeTxId = await newMerge(lucidBase, assignOutRef, newSettingsUtxo);
    const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

    await newClaim(lucidBase, mergeOutRef, newSettingsUtxo);
  });
});
