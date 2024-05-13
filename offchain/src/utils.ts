import { creationFee, MIN_ADA, rewardFee } from "./constants";
import { WalletT } from "./types";
import dotenv from "dotenv";
import { Assets, Lucid } from "lucid-cardano";

dotenv.config();

function validatorParams(lucid: Lucid) {
  const githoneyAddr = process.env.GITHONEY_ADDR!;
  const gitHoneyCredentials = lucid.utils.getAddressDetails(githoneyAddr);
  const gitHoneyWallet: WalletT = {
    paymentKey: gitHoneyCredentials.paymentCredential!.hash,
    stakeKey: gitHoneyCredentials.stakeCredential!.hash
  };

  return {
    githoneyWallet: gitHoneyWallet,
    creationFee: BigInt(creationFee),
    rewardFee: BigInt(rewardFee)
  };
}

function addrToWallet(address: string, lucid: Lucid): WalletT {
  const details = lucid.utils.getAddressDetails(address);
  return {
    paymentKey: details.paymentCredential!.hash,
    stakeKey: details.stakeCredential!.hash
  };
}

function calculateRewards(assets: Assets, feePercent: bigint) {
  return Object.fromEntries(
    Object.entries(assets).map(([asset, amount]: [string, bigint]) => {
      if (asset === "lovelace") {
        const minAda = 2n * MIN_ADA;
        const reward = (amount - minAda) * feePercent;
        return [asset, reward + minAda];
      } else {
        return [asset, amount * feePercent];
      }
    })
  );
}

export { validatorParams, calculateRewards, addrToWallet };
