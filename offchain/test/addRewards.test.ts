import { describe, it } from "mocha";
import {
  ACCOUNT_ADMIN,
  ACCOUNT_0,
  ACCOUNT_MANTAINER,
  bounty_id,
  emulator,
  tokenAUnit
} from "./emulatorConfig";
import { Lucid } from "lucid-cardano";
import { addRewards } from "../src/operations/addRewards";
import { createBounty } from "../src/operations/create";
import { signAndSubmitCreate, signAndSubmitAddRewards } from "./utils";

const lucid = await Lucid.new(emulator, "Custom");

describe("Add Rewards tests", async () => {
  const now = new Date();
  const deadline = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1).getTime(); // Tomorrow
  console.log("Deadline", deadline);
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
  const { createTxId } = await signAndSubmitCreate(lucid, createTx);
  emulator.awaitBlock(3);

  it("Add Rewards with same token", async () => {
    const [bountyUTxO] = await lucid.utxosByOutRef([
      { txHash: createTxId, outputIndex: 0 }
    ]);
    const reward = {
      unit: "lovelace",
      amount: 50n
    };
    const addRewardsTx = await addRewards(
      bountyUTxO,
      ACCOUNT_0.address,
      reward,
      lucid
    );
    signAndSubmitAddRewards(lucid, addRewardsTx);
  });

  it("Add Rewards with different token", async () => {
    const [bountyUTxO] = await lucid.utxosByOutRef([
      { txHash: createTxId, outputIndex: 0 }
    ]);
    const reward = {
      unit: tokenAUnit,
      amount: 75n
    };
    const addRewardsTx = await addRewards(
      bountyUTxO,
      ACCOUNT_0.address,
      reward,
      lucid
    );
    signAndSubmitAddRewards(lucid, addRewardsTx);
  });

  // it("Add Rewards with already merged bounty", async () => {
  // TODO - Add merged bounty
  //   const [bountyUTxO] = await lucid.utxosByOutRef([
  //     { txHash: txId.createTxId, outputIndex: 0 }
  //   ]);
  //   const reward = {
  //     unit: tokenAUnit,
  //     amount: 100n
  //   };
  //   const addRewardsTx = await addRewards(
  //     bountyUTxO,
  //     ACCOUNT_0.address,
  //     reward,
  //     lucid
  //   );
  //   signAndSubmitAddRewards(lucid, addRewardsTx);
  // });
});
