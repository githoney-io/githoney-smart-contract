import { creationFee, rewardFee } from "./constants";
import { WalletT } from "./types";
import dotenv from "dotenv";
import { AddressDetails, Lucid } from "lucid-cardano";

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

export { validatorParams, addrToWallet };
