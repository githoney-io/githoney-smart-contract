import { describe, expect, it } from "@jest/globals";
import { Assets, OutRef } from "@spacebudz/lucid";
import {
  newAssign,
  newBounty,
  newMerge,
  signSubmitAndWaitConfirmation,
} from "../utils.ts";
import { closeBounty, addRewards } from "../../operations/index.ts";
import { logger, lucidBase as lucid } from "../../utils/utils.ts";
import {
  adminAddr,
  adminSeed,
  settingsRef,
  sponsorAddr,
  sponsorSeed,
} from "../../constants.ts";

describe("Close tests", () => {
  it("Close Bounty After Contributor Assignment", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    const createTxId = await newBounty(lucid, settingsUtxo);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const { closeCbor } = await closeBounty(
      adminAddr,
      {},
      settingsUtxo,
      assignOutRef,
    );
    lucid.selectWalletFromSeed(adminSeed);
    await signSubmitAndWaitConfirmation(closeCbor, lucid);
  }, 300000);

  it("Close Bounty Before Contributor Assignment", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    const createTxId = await newBounty(lucid, settingsUtxo);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const { closeCbor } = await closeBounty(
      adminAddr,
      {},
      settingsUtxo,
      createOutRef,
    );
    lucid.selectWalletFromSeed(adminSeed);
    await signSubmitAndWaitConfirmation(closeCbor, lucid);
  }, 300000);

  it("Close Bounty already merged", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      const mergeTxId = await newMerge(lucid, assignOutRef, settingsUtxo);
      const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

      await closeBounty(adminAddr, {}, settingsUtxo, mergeOutRef);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toBe("Bounty already merged");
    }
  }, 300000);

  it("Close Bounty after adding rewards", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    const createTxId = await newBounty(lucid, settingsUtxo);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const rewardAmount = 100n;
    const { addRewardCbor } = await addRewards(
      rewardAmount,
      settingsUtxo,
      sponsorAddr,
      assignOutRef,
    );
    lucid.selectWalletFromSeed(sponsorSeed);
    const addRewardsTxId = await signSubmitAndWaitConfirmation(
      addRewardCbor,
      lucid,
    );
    const addRewardsOutRef: OutRef = {
      txHash: addRewardsTxId,
      outputIndex: 0,
    };

    const rewardUnit =
      "fb279c09175731ade05f7314a9b36cf923c7a3d6873be26bbd1eeccf746f6b656e44";

    const refundings: { [key: string]: Assets } = {
      [sponsorAddr]: {
        [rewardUnit]: rewardAmount,
      },
    };

    const { closeCbor } = await closeBounty(
      adminAddr,
      refundings,
      settingsUtxo,
      addRewardsOutRef,
    );
    lucid.selectWalletFromSeed(adminSeed);
    await signSubmitAndWaitConfirmation(closeCbor, lucid);
  }, 300000);

  it("Close Bounty already merged", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      const mergeTxId = await newMerge(lucid, assignOutRef, settingsUtxo);
      const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

      await closeBounty(adminAddr, {}, settingsUtxo, mergeOutRef);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toBe("Bounty already merged");
    }
  }, 300000);
});
