import { describe, it } from "mocha";
import {
  ACCOUNT_ADMIN,
  ACCOUNT_0,
  ACCOUNT_MANTAINER,
  bounty_id,
  emulator,
  tokenAUnit,
  signAndSubmit
} from "./emulatorConfig";
import { Lucid, OutRef } from "lucid-cardano";
import { addRewards } from "../src/operations/addRewards";
import { createBounty } from "../src/operations/create";

const lucid = await Lucid.new(emulator, "Custom");

describe("Add Rewards tests", async () => {
  const now = new Date();
  const deadline = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1).getTime(); // Tomorrow

  it("Add Rewards with same token", async () => {
    const createTx = await createBounty(
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
    emulator.awaitBlock(1);

    lucid.selectWalletFromSeed(ACCOUNT_MANTAINER.seedPhrase);
    const { txId } = await signAndSubmit(lucid, createTx);
    emulator.awaitBlock(3);

    const bountyOutRef: OutRef = { txHash: txId, outputIndex: 0 };
    const reward = {
      unit: "lovelace",
      amount: 50n
    };
    const addRewardsTx = await addRewards(
      bountyOutRef,
      ACCOUNT_0.address,
      reward,
      lucid
    );
    emulator.awaitBlock(1);

    lucid.selectWalletFromSeed(ACCOUNT_0.seedPhrase);
    await signAndSubmit(lucid, addRewardsTx);
  });

  it("Add Rewards with different token", async () => {
    const createTx = await createBounty(
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
    emulator.awaitBlock(1);

    lucid.selectWalletFromSeed(ACCOUNT_MANTAINER.seedPhrase);
    const { txId } = await signAndSubmit(lucid, createTx);
    emulator.awaitBlock(3);

    const bountyOutRef: OutRef = { txHash: txId, outputIndex: 0 };
    const reward = {
      unit: tokenAUnit,
      amount: 75n
    };
    const addRewardsTx = await addRewards(
      bountyOutRef,
      ACCOUNT_0.address,
      reward,
      lucid
    );
    emulator.awaitBlock(1);

    lucid.selectWalletFromSeed(ACCOUNT_0.seedPhrase);
    await signAndSubmit(lucid, addRewardsTx);
  });

  // it("Add Rewards with already merged bounty", async () => {
  // TODO - Add merged bounty
  //   const bountyOutRef: OutRef = { txHash: txId, outputIndex: 0 };
  //   const reward = {
  //     unit: tokenAUnit,
  //     amount: 100n
  //   };
  //   const addRewardsTx = await addRewards(
  //     bountyOutRef,
  //     ACCOUNT_0.address,
  //     reward,
  //     lucid
  //   );
  //   emulator.awaitBlock(1);

  //   lucid.selectWalletFromSeed(ACCOUNT_0.seedPhrase);
  //   signAndSubmit(lucid, addRewardsTx);
  // });
});
