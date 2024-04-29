import { buildGithoneyMintingPolicy, buildGithoneyValidator } from "../scripts";
import { Data, fromText, toUnit } from "lucid-cardano";
import { CapsuleValidatorRedeemer } from "../types";
import { NetConfig, Roles } from "../utils";

async function depositBounty(
  utxoHash: string,
  maintainerAddr: string,
  roleTokenPolicy: string,
  amount: bigint,
  netConfig: NetConfig
) {
  console.debug("START depositBounty");
  const lucid = netConfig.lucidAdmin!;
  const gitHoneyValidator = buildGithoneyValidator();
  const validatorAddress = lucid.utils.validatorToAddress(gitHoneyValidator);
  const contractUtxo = await lucid.utxosByOutRef([
    { txHash: utxoHash, outputIndex: 0 }
  ]);
  const lovelaceInContract = contractUtxo[0].assets.lovelace;

  const maintainerUnit = toUnit(roleTokenPolicy, fromText(Roles.MAINTAINER));
  const utxos = await lucid.utxosAtWithUnit(maintainerAddr, maintainerUnit);
  if (utxos.length === 0) {
    throw new Error(
      `Maintainer Token not found with policy ${roleTokenPolicy}`
    );
  }
  console.debug("Maintainer Address", maintainerAddr);
  lucid.selectWalletFrom({ address: maintainerAddr });
  const tx = await lucid
    .newTx()
    .collectFrom(utxos)
    .collectFrom(contractUtxo, CapsuleValidatorRedeemer.Deposit())
    .payToContract(validatorAddress, Data.void(), {
      lovelace: amount + lovelaceInContract
    })
    .attachSpendingValidator(gitHoneyValidator)
    .complete();

  lucid.selectWalletFromSeed(netConfig.SEED);
  const txSigned = await tx.sign().complete();

  console.debug("END depositBounty");
  return txSigned.toString();
}

export default depositBounty;
