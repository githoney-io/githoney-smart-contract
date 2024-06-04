import { describe, it } from "mocha";
import { Lucid, OutRef } from "lucid-cardano";
import { newAssign, newBounty, newMerge, signAndSubmit } from "./utils";
import { ACCOUNT_0, emulator, tokenAUnit } from "./emulatorConfig";
import { addRewards } from "../src/operations/addRewards";
import { expect } from "chai";

const lucid = await Lucid.new(emulator, "Custom");

describe("Add Rewards tests", async () => {
  it("Add Rewards with same token", async () => {
    const createTxIdId = await newBounty(lucid);

    const bountyOutRef: OutRef = { txHash: createTxIdId, outputIndex: 0 };
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
    emulator.awaitBlock(3);

    lucid.selectWalletFromSeed(ACCOUNT_0.seedPhrase);
    await signAndSubmit(lucid, addRewardsTx);
  });

  it("Add Rewards with different token", async () => {
    const createTxIdId = await newBounty(lucid);

    const bountyOutRef: OutRef = { txHash: createTxIdId, outputIndex: 0 };
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
    emulator.awaitBlock(3);

    lucid.selectWalletFromSeed(ACCOUNT_0.seedPhrase);
    await signAndSubmit(lucid, addRewardsTx);
  });

  it("Add Rewards with already merged bounty", async () => {
    try {
      const createTxId = await newBounty(lucid);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      const mergeTxId = await newMerge(lucid, assignOutRef);
      const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

      const reward = {
        unit: tokenAUnit,
        amount: 100n
      };
      await addRewards(mergeOutRef, ACCOUNT_0.address, reward, lucid);
    } catch (e) {
      const error = e as Error;
      console.log("Error:", error.message);
      expect(error.message).to.equal("Bounty already merged");
    }
  });
});
