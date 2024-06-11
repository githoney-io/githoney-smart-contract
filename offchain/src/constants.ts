import dotenv from "dotenv";

dotenv.config();

const Roles = {
  MAINTAINER: "Maintainer",
  GIT_HONEY: "GitHoney",
  ADMIN: "Admin",
  CONTRIBUTOR: "Contributor"
};

const MIN_ADA = 3_000_000n;

const settingsTokenName = "settingsNFT";
const creationFee = BigInt(process.env.CREATION_FEE!);
const rewardFee = BigInt(process.env.REWARD_FEE!);
const githoneyAddr = process.env.GITHONEY_ADDRESS!;

export {
  creationFee,
  rewardFee,
  githoneyAddr,
  settingsTokenName,
  MIN_ADA,
  Roles
};
