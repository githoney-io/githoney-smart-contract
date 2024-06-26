import { describe, it } from "mocha";
import { expect } from "chai";
import {
  ACCOUNT_ADMIN,
  ACCOUNT_MANTAINER,
  bounty_id,
  emulator,
  lucid
} from "../emulatorConfig";
import { createBounty } from "../../src/operations/bounties/create";
import { deployUtxo, signAndSubmit } from "../utils";
import logger from "../../src/logger";

describe("Create tests", async () => {
  const now = new Date();
  it("Create a New Bounty", async () => {
    const { settingsUtxo } = await deployUtxo(lucid);

    const deadline = new Date(
      now.getTime() + 1000 * 60 * 60 * 24 * 2
    ).getTime(); // 2 days from now
    const tx = await createBounty(
      settingsUtxo,
      ACCOUNT_MANTAINER.address,
      ACCOUNT_ADMIN.address,
      {
        lovelace: 100n
      },
      BigInt(deadline),
      bounty_id,
      lucid
    );
    emulator.awaitBlock(3);
    lucid.selectWalletFromSeed(ACCOUNT_MANTAINER.seedPhrase);
    await signAndSubmit(lucid, tx);
  });

  it("Bounty with deadline in the past", async () => {
    const { settingsUtxo } = await deployUtxo(lucid);

    try {
      const deadline = new Date(
        now.getTime() - 1000 * 60 * 60 * 24 * 1
      ).getTime(); // Yesterday
      await createBounty(
        settingsUtxo,
        ACCOUNT_MANTAINER.address,
        ACCOUNT_ADMIN.address,
        {
          lovelace: 100n
        },
        BigInt(deadline),
        bounty_id,
        lucid
      );
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).to.equal(
        "Deadline must be at least 24 hours from now"
      );
    }
  });

  it("Bounty with negative fees", async () => {
    const { settingsUtxo } = await deployUtxo(lucid);

    try {
      const deadline = new Date(
        now.getTime() + 1000 * 60 * 60 * 24 * 2
      ).getTime();
      await createBounty(
        settingsUtxo,
        ACCOUNT_MANTAINER.address,
        ACCOUNT_ADMIN.address,
        {
          lovelace: 100n
        },
        BigInt(deadline),
        bounty_id,
        lucid
      );
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).to.equal("Negative fees are not allowed");
    }
  });
});
