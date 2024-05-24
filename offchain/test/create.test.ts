import { describe, it } from "mocha";
import {
  ACCOUNT_ADMIN,
  ACCOUNT_MANTAINER,
  bounty_id,
  emulator
} from "./emulatorConfig";
import { Lucid } from "lucid-cardano";
import { createBounty } from "../src/operations/create";
import { signAndSubmitCreate } from "./utils";

const lucid = await Lucid.new(emulator, "Custom");

describe("Create tests", () => {
  const now = new Date();
  it("Create a New Bounty", async () => {
    const deadline = new Date(
      now.getTime() + 1000 * 60 * 60 * 24 * 1
    ).getTime(); // Tomorrow
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
    signAndSubmitCreate(lucid, tx);
  });

  it("Bounty with deadline in the past", async () => {
    const deadline = new Date(
      now.getTime() - 1000 * 60 * 60 * 24 * 1
    ).getTime(); // Yesterday
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
    signAndSubmitCreate(lucid, tx);
  });

  it("Bounty with negative fees", async () => {
    const deadline = new Date(
      now.getTime() + 1000 * 60 * 60 * 24 * 1
    ).getTime(); // Tomorrow
    const tx = await createBounty(
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
    signAndSubmitCreate(lucid, tx);
  });
});
