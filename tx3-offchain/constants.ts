import dotenv from "dotenv";
import { OutRef } from "@spacebudz/lucid";

dotenv.config();

const MIN_ADA = 3_000_000n;

const settingsTokenName = "settingsNFT";
const creationFee = BigInt(process.env.CREATION_FEE!);
const rewardFee = BigInt(process.env.REWARD_FEE!);
const githoneyAddr = process.env.GITHONEY_ADDRESS!;
const maintainerAddr = process.env.MAINTAINER_ADDRESS!;
const contributorAddr = process.env.CONTRIBUTOR_ADDRESS!;
const sponsorAddr = process.env.SPONSOR_ADDRESS!;
const ftAddr = process.env.FT_ADDRESS!;
const settingsRef: OutRef = {
  txHash: process.env.SETTINGS_TX_HASH!,
  outputIndex: 0,
};
const settingsNftRef: OutRef = {
  txHash: process.env.SETTINGS_NFT_TX_HASH!,
  outputIndex: process.env.SETTINGS_NFT_OUTPUT_INDEX! as unknown as number,
};

const githoneySeed = process.env.GITHONEY_SEED!;
const maintainerSeed = process.env.MAINTAINER_SEED!;
const contributorSeed = process.env.CONTRIBUTOR_SEED!;
const sponsorSeed = process.env.SPONSOR_SEED!;

export {
  MIN_ADA,
  contributorAddr,
  contributorSeed,
  creationFee,
  githoneyAddr,
  githoneySeed,
  maintainerAddr,
  maintainerSeed,
  rewardFee,
  settingsRef,
  settingsNftRef,
  settingsTokenName,
  sponsorAddr,
  sponsorSeed,
  ftAddr,
};
