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

const now = new Date();
const deadline = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1).getTime(); // Tomorrow
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

describe("Add Rewards tests", async () => {
  it("Add Rewards", async () => {
    const [bountyUTxO] = await lucid.utxosByOutRef([
      { txHash: createTxId, outputIndex: 0 }
    ]);
    console.log("Bounty UTXO", bountyUTxO);
    const reward = {
      unit: tokenAUnit,
      amount: 100n
    };
    const addRewardsTx = await addRewards(
      bountyUTxO,
      ACCOUNT_0.address,
      reward,
      lucid
    );
    signAndSubmitAddRewards(lucid, addRewardsTx);
  });
});
