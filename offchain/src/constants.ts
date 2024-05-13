import dotenv from "dotenv";
import { Lucid } from "lucid-cardano";

dotenv.config();

const Roles = {
  MAINTAINER: "Maintainer",
  GIT_HONEY: "GitHoney",
  ADMIN: "Admin",
  CONTRIBUTOR: "Contributor"
};

const MIN_ADA = 2_000_000n;

const ControlTokenName = "ControlToken";
const creationFee = process.env.CREATION_FEE!;
const rewardFee = process.env.REWARD_FEE!;
const githoneyAddr = process.env.GITHONEY_ADDR!;

export {
  creationFee,
  rewardFee,
  githoneyAddr,
  ControlTokenName,
  MIN_ADA,
  Roles
};
