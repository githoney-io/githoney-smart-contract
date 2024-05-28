import { describe, it } from "mocha";
import {
  ACCOUNT_0,
  emulator,
  tokenAUnit,
  signAndSubmit,
  newBounty
} from "./emulatorConfig";
import { Lucid, OutRef } from "lucid-cardano";
import { addRewards } from "../src/operations/addRewards";

const lucid = await Lucid.new(emulator, "Custom");

describe("Add Rewards tests", async () => {
  it("Add Rewards with same token", async () => {
    const createTx = await newBounty(lucid);

    const bountyOutRef: OutRef = { txHash: createTx.txId, outputIndex: 0 };
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
    const createTx = await newBounty(lucid);

    const bountyOutRef: OutRef = { txHash: createTx.txId, outputIndex: 0 };
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
