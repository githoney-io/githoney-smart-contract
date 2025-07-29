import { describe, expect, it } from "@jest/globals";
import {
  bountyId,
  logger,
  rewardAmount,
  rewardName,
  rewardPolicy,
} from "../utils.ts";
import { createBounty } from "../../operations/index.ts";
import { lucidBase as lucid, signAndSubmit } from "../../utils/utils.ts";
import {
  adminAddr,
  githoneyAddr,
  maintainerAddr,
  settingsRef,
} from "../../constants.ts";

describe("Create tests", async () => {
  const now = new Date();
  it("Create a New Bounty", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    const deadline = new Date(
      now.getTime() + 1000 * 60 * 60 * 24 * 2,
    ).getTime(); // 2 days from now

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
    console.log("Create transaction CBOR:", createCbor);

    const createTx = await signAndSubmit(createCbor);
    lucid.selectWalletFromSeed(maintainerAddr);
    await signAndSubmit(createTx, lucid);
  });

  it("Bounty with deadline in the past", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);

    try {
      const deadline = new Date(
        now.getTime() - 1000 * 60 * 60 * 24 * 1,
      ).getTime(); // Yesterday
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

      const createTx = await signAndSubmit(createCbor);
      lucid.selectWalletFromSeed(maintainerAddr);
      await signAndSubmit(createTx, lucid);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toBe("Deadline must be at least 24 hours from now");
    }
  });

  it("Bounty with negative fees", async () => {
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

      const createTx = await signAndSubmit(createCbor);
      lucid.selectWalletFromSeed(maintainerAddr);
      await signAndSubmit(createTx, lucid);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toBe("Negative fees are not allowed");
    }
  });
});
