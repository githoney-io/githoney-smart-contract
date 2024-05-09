import dotenv from "dotenv";
import { Lucid } from "lucid-cardano";

dotenv.config();

interface NetConfig {
  SIGN_SERVER_URL: string;
  SEED: string;
  MARLOWE_RT_WEBSERVER_URL: string;
  BLOCKFROST_PROJECT_ID: string;
  BLOCKFROST_URL: string;
  lucidAdmin: Lucid | null;
}

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

export { creationFee, rewardFee, ControlTokenName, MIN_ADA, Roles, NetConfig };
