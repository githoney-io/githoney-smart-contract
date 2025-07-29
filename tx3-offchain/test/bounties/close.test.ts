import { describe, expect, it } from "@jest/globals";
import { OutRef } from "@spacebudz/lucid";
import {
  logger,
  newAssign,
  newBounty,
  newMerge,
  waitForUtxosUpdate,
} from "../utils.ts";
import { closeBounty, addRewards } from "../../operations/index.ts";
import { lucidBase as lucid, signAndSubmit } from "../../utils/utils.ts";
import {
  adminAddr,
  adminSeed,
  settingsRef,
  sponsorAddr,
  sponsorSeed,
} from "../../constants.ts";

describe("Close tests", async () => {
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
    const txId = await signAndSubmit(closeCbor, lucid);
    waitForUtxosUpdate(lucid, txId);
  });

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
    const txId = await signAndSubmit(closeCbor, lucid);
    waitForUtxosUpdate(lucid, txId);
  });

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
  });

  it("Close Bounty after adding rewards", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    const createTxId = await newBounty(lucid, settingsUtxo);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const { addRewardCbor } = await addRewards(
      100n,
      settingsUtxo,
      sponsorAddr,
      assignOutRef,
    );
    lucid.selectWalletFromSeed(sponsorSeed);
    const addRewardsTxId = await signAndSubmit(addRewardCbor, lucid);
    waitForUtxosUpdate(lucid, addRewardsTxId);
    const addRewardsOutRef: OutRef = {
      txHash: addRewardsTxId,
      outputIndex: 0,
    };

    const { closeCbor } = await closeBounty(
      adminAddr,
      {}, // REVIEW
      settingsUtxo,
      addRewardsOutRef,
    );
    lucid.selectWalletFromSeed(adminSeed);
    const txId = await signAndSubmit(closeCbor, lucid);
    waitForUtxosUpdate(lucid, txId);
  });
});
