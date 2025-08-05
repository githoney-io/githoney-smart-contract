import { describe, expect, it } from "@jest/globals";
import {
  bountyId,
  rewardAmount,
  rewardName,
  rewardPolicy,
  signSubmitAndWaitConfirmation,
} from "../utils.ts";
import { createBounty } from "../../operations/index.ts";
import { logger, lucidBase as lucid } from "../../utils/utils.ts";
import {
  adminAddr,
  maintainerAddr,
  maintainerSeed,
  settingsRef,
} from "../../constants.ts";

describe("Create tests", () => {
  const now = new Date();
  it("Create a new bounty with token", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    const deadline = new Date(
      now.getTime() + 1000 * 60 * 60 * 24 * 2,
    ).getTime(); // 2 days from now

    const { createCbor } = await createBounty(
      rewardPolicy,
      rewardName,
      rewardAmount,
      bountyId,
      maintainerAddr,
      adminAddr,
      settingsUtxo,
      BigInt(deadline),
    );
    lucid.selectWalletFromSeed(maintainerSeed);
    await signSubmitAndWaitConfirmation(createCbor, lucid);
  }, 300000);

  it("Create a new bounty with lovelace", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
    const deadline = new Date(
      now.getTime() + 1000 * 60 * 60 * 24 * 2,
    ).getTime();

    const { createCbor } = await createBounty(
      "",
      "",
      1_000_000n,
      bountyId,
      maintainerAddr,
      adminAddr,
      settingsUtxo,
      BigInt(deadline),
    );
    lucid.selectWalletFromSeed(maintainerSeed);
    await signSubmitAndWaitConfirmation(createCbor, lucid);
  }, 300000);

  it("Bounty with deadline in the past", async () => {
    const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);

    try {
      const deadline = new Date(
        now.getTime() - 1000 * 60 * 60 * 24 * 1,
      ).getTime(); // Yesterday
      await createBounty(
        rewardPolicy,
        rewardName,
        rewardAmount,
        bountyId,
        maintainerAddr,
        adminAddr,
        settingsUtxo,
        BigInt(deadline),
      );
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toBe("Deadline must be at least 24 hours from now");
    }
  });
});
