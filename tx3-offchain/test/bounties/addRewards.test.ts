import { describe, expect, it } from "@jest/globals";
import { OutRef } from "@spacebudz/lucid";
import {
  bountyId,
  newAssign,
  newBounty,
  newClaim,
  newMerge,
  signSubmitAndWaitConfirmation,
} from "../utils.ts";
import {
  createBounty,
  addRewards,
  updateSettings,
} from "../../operations/index.ts";
import { logger, lucidBase as lucid } from "../../utils/utils.ts";
import {
  adminAddr,
  adminSeed,
  maintainerAddr,
  settingsRef,
  sponsorSeed,
  sponsorAddr,
  maintainerSeed,
} from "../../constants.ts";

describe("Add Rewards tests", () => {
  it("Add Rewards with same token", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);

    const createTxHash = await newBounty(lucid, settingsUtxo);
    const createOutRef: OutRef = { txHash: createTxHash, outputIndex: 0 };

    const additionalRewardAmount = 500n;
    const { addRewardCbor } = await addRewards(
      additionalRewardAmount,
      settingsUtxo,
      sponsorAddr,
      createOutRef,
    );
    lucid.selectWalletFromSeed(sponsorSeed);
    await signSubmitAndWaitConfirmation(addRewardCbor, lucid);
  }, 300000);

  it("Add Rewards with lovelace", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    const now = new Date();
    const deadline = new Date(
      now.getTime() + 1000 * 60 * 60 * 24 * 2,
    ).getTime();

    const { createCbor } = await createBounty(
      "",
      "",
      5_000_000n,
      bountyId,
      maintainerAddr,
      adminAddr,
      settingsUtxo,
      BigInt(deadline),
    );

    lucid.selectWalletFromSeed(maintainerSeed);
    const createTxHash = await signSubmitAndWaitConfirmation(createCbor, lucid);
    const createOutRef: OutRef = { txHash: createTxHash, outputIndex: 0 };

    const additionalRewardAmount = 5_000_000n;
    const { addRewardCbor } = await addRewards(
      additionalRewardAmount,
      settingsUtxo,
      sponsorAddr,
      createOutRef,
      true, // withLovelace
    );

    lucid.selectWalletFromSeed(sponsorSeed);
    await signSubmitAndWaitConfirmation(addRewardCbor, lucid);
  }, 300000);

  it("Add Rewards with already merged bounty", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);

    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      const mergeTxId = await newMerge(lucid, assignOutRef, settingsUtxo);
      const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

      const additionalRewardAmount = 100n;
      await addRewards(
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
  }, 300000);
});

describe("Reward bounds", () => {
  it("0 reward fee", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);

    const newSettings = {
      creationFee: 2000000n,
      rewardFee: 0n,
    };
    // Update settings with 0 reward fee
    const { updateCbor } = await updateSettings(settingsUtxo, newSettings);
    const lucidAdmin = lucid.selectWalletFromSeed(adminSeed);
    const updateTxHash = await signSubmitAndWaitConfirmation(
      updateCbor,
      lucidAdmin,
    );

    const [newSettingsUtxo] = await lucid.utxosByOutRef([
      { txHash: updateTxHash, outputIndex: 0 },
    ]);

    const createTxId = await newBounty(lucid, newSettingsUtxo);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef, newSettingsUtxo);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const mergeTxId = await newMerge(lucid, assignOutRef, newSettingsUtxo);
    const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

    await newClaim(lucid, mergeOutRef, newSettingsUtxo);
  }, 300000);

  it("10000 reward fee", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);

    const newSettings = {
      creationFee: 2000000n,
      rewardFee: 1000n,
    };
    // Update settings with 10000 reward fee
    const { updateCbor } = await updateSettings(settingsUtxo, newSettings);
    lucid.selectWalletFromSeed(adminSeed);
    const updateTxHash = await signSubmitAndWaitConfirmation(updateCbor, lucid);
    const [newSettingsUtxo] = await lucid.utxosByOutRef([
      { txHash: updateTxHash, outputIndex: 0 },
    ]);

    const createTxId = await newBounty(lucid, newSettingsUtxo);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef, newSettingsUtxo);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const mergeTxId = await newMerge(lucid, assignOutRef, newSettingsUtxo);
    const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

    await newClaim(lucid, mergeOutRef, newSettingsUtxo);
  }, 360000);
});
