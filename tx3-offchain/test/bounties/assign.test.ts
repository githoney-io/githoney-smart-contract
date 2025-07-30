import { describe, expect, it } from "@jest/globals";
import {
  bountyId,
  logger,
  rewardAmount,
  rewardName,
  rewardPolicy,
  waitForUtxosUpdate,
} from "../utils.ts";
import {
  createBounty,
  assignContributor,
  mergeBounty,
} from "../../operations/index.ts";
import { lucidBase as lucid, signAndSubmit } from "../../utils/utils.ts";
import {
  adminAddr,
  adminSeed,
  contributorAddr,
  contributorSeed,
  githoneyAddr,
  maintainerAddr,
  settingsRef,
} from "../../constants.ts";
import { OutRef } from "@spacebudz/lucid";

describe("Assign Contributor tests", () => {
  const now = new Date();
  it("Assign Contributor", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    const deadline = new Date(
      now.getTime() + 1000 * 60 * 60 * 24 * 2,
    ).getTime();
    const { createCbor } = await createBounty(
      githoneyAddr,
      rewardPolicy,
      rewardName,
      rewardAmount,
      bountyId,
      maintainerAddr,
      adminAddr,
      settingsUtxo,
      BigInt(deadline),
    );

    const createTxHash = await signAndSubmit(createCbor);
    waitForUtxosUpdate(lucid, createTxHash);
    const bountyOutRef: OutRef = { txHash: createTxHash, outputIndex: 0 };

    const { assignCbor } = await assignContributor(
      contributorAddr,
      settingsUtxo,
      bountyOutRef,
    );
    console.log("Assign transaction CBOR:", assignCbor);
    lucid.selectWalletFromSeed(contributorSeed);
    await signAndSubmit(assignCbor, lucid);
  });

  it("Assign Contributor with already merged bounty", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);

    try {
      const deadline = new Date(
        now.getTime() + 1000 * 60 * 60 * 24 * 2,
      ).getTime();

      const { createCbor } = await createBounty(
        githoneyAddr,
        rewardPolicy,
        rewardName,
        rewardAmount,
        bountyId,
        maintainerAddr,
        adminAddr,
        settingsUtxo,
        BigInt(deadline),
      );

      lucid.selectWalletFromSeed(adminSeed);
      const createTxHash = await signAndSubmit(createCbor, lucid);
      waitForUtxosUpdate(lucid, createTxHash);
      const createOutRef: OutRef = { txHash: createTxHash, outputIndex: 0 };

      const { assignCbor } = await assignContributor(
        contributorAddr,
        settingsUtxo,
        createOutRef,
      );

      lucid.selectWalletFromSeed(contributorSeed);
      const assignTxHash = await signAndSubmit(assignCbor, lucid);
      waitForUtxosUpdate(lucid, assignTxHash);
      const assignOutRef: OutRef = { txHash: assignTxHash, outputIndex: 0 };

      const { mergeCbor } = await mergeBounty(
        adminAddr,
        settingsUtxo,
        assignOutRef,
      );
      lucid.selectWalletFromSeed(adminSeed);
      const mergeTxHash = await signAndSubmit(mergeCbor, lucid);
      waitForUtxosUpdate(lucid, mergeTxHash);
      const mergeOutRef: OutRef = { txHash: mergeTxHash, outputIndex: 0 };

      await assignContributor(contributorAddr, settingsUtxo, mergeOutRef);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toBe("Bounty already merged");
    }
  });

  it("Assign Contributor with contributor already assigned", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);

    try {
      const deadline = new Date(
        now.getTime() + 1000 * 60 * 60 * 24 * 2,
      ).getTime();

      const { createCbor } = await createBounty(
        githoneyAddr,
        rewardPolicy,
        rewardName,
        rewardAmount,
        bountyId,
        maintainerAddr,
        adminAddr,
        settingsUtxo,
        BigInt(deadline),
      );

      lucid.selectWalletFromSeed(adminSeed);
      const createTxHash = await signAndSubmit(createCbor, lucid);
      waitForUtxosUpdate(lucid, createTxHash);
      const createOutRef: OutRef = { txHash: createTxHash, outputIndex: 0 };

      // Assign contributor
      const { assignCbor } = await assignContributor(
        contributorAddr,
        settingsUtxo,
        createOutRef,
      );

      lucid.selectWalletFromSeed(contributorSeed);
      const assignTxHash = await signAndSubmit(assignCbor, lucid);
      waitForUtxosUpdate(lucid, assignTxHash);
      const assignOutRef: OutRef = { txHash: assignTxHash, outputIndex: 0 };

      // Try to assign different contributor (this should fail)
      await assignContributor(adminAddr, settingsUtxo, assignOutRef);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toBe("Bounty already has a contributor");
    }
  });
});
