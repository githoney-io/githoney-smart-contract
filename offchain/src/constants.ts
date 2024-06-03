import dotenv from "dotenv";

dotenv.config();

const Roles = {
  MAINTAINER: "Maintainer",
  GIT_HONEY: "GitHoney",
  ADMIN: "Admin",
  CONTRIBUTOR: "Contributor"
};

const MIN_ADA = 3_000_000n;

const controlTokenName = "controlToken";
const creationFee = process.env.CREATION_FEE!;
const rewardFee = process.env.REWARD_FEE!;
const githoneyAddr = process.env.GITHONEY_ADDRESS!;

export {
  creationFee,
  rewardFee,
  githoneyAddr,
  controlTokenName,
  MIN_ADA,
  Roles
};
