import { creationFee, rewardFee } from "./constants";
import { WalletT } from "./types";
import dotenv from "dotenv";
import { Lucid } from "lucid-cardano";

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

export { validatorParams };
