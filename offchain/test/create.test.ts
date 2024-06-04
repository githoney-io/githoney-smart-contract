import { describe, it } from "mocha";
import { expect } from "chai";
import {
  ACCOUNT_ADMIN,
  ACCOUNT_MANTAINER,
  bounty_id,
  emulator
} from "./emulatorConfig";
import { Lucid } from "lucid-cardano";
import { createBounty } from "../src/operations/create";
import { signAndSubmit } from "./utils";

const lucid = await Lucid.new(emulator, "Custom");

describe("Create tests", () => {
  const now = new Date();
  it("Create a New Bounty", async () => {
    const deadline = new Date(
      now.getTime() + 1000 * 60 * 60 * 24 * 2
    ).getTime(); // 2 days from now
    const tx = await createBounty(
      ACCOUNT_MANTAINER.address,
      ACCOUNT_ADMIN.address,
      {
        unit: "lovelace",
        amount: 100n
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
    try {
      const deadline = new Date(
        now.getTime() - 1000 * 60 * 60 * 24 * 1
      ).getTime(); // Yesterday
      await createBounty(
        ACCOUNT_MANTAINER.address,
        ACCOUNT_ADMIN.address,
        {
          unit: "lovelace",
          amount: 100n
        },
        BigInt(deadline),
        bounty_id,
        lucid
      );
    } catch (e) {
      const error = e as Error;
      console.log("Error:", error.message);
      expect(error.message).to.equal(
        "Deadline must be at least 24 hours from now"
      );
    }
  });

  it("Bounty with negative fees", async () => {
    try {
      const deadline = new Date(
        now.getTime() + 1000 * 60 * 60 * 24 * 2
      ).getTime();
      await createBounty(
        ACCOUNT_MANTAINER.address,
        ACCOUNT_ADMIN.address,
        {
          unit: "lovelace",
          amount: -100n
        },
        BigInt(deadline),
        bounty_id,
        lucid
      );
    } catch (e) {
      const error = e as Error;
      console.log("Error:", error.message);
      expect(error.message).to.equal("Negative fees are not allowed");
    }
  });
});
