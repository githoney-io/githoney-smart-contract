import dotenv from "dotenv";
import { OutRef } from "@spacebudz/lucid";

dotenv.config();

const MIN_ADA = 3_000_000n;

const settingsTokenName = "settingsNFT";
const creationFee = BigInt(process.env.CREATION_FEE!);
const rewardFee = BigInt(process.env.REWARD_FEE!);
const githoneyAddr = process.env.GITHONEY_ADDRESS!;
const maintainerAddr = process.env.MAINTAINER_ADDRESS!;
const adminAddr = process.env.ADMIN_ADDRESS!;
const settingsRef: OutRef = {
  txHash: "cbb68dabcb9f6ee9fb038d9505be33c7a450f1cffa8d7cf4f9757ca39d787ec1",
  outputIndex: 0,
};

export {
  MIN_ADA,
  creationFee,
  rewardFee,
  githoneyAddr,
  settingsTokenName,
  maintainerAddr,
  adminAddr,
  settingsRef,
};
