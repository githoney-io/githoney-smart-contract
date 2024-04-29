import { buildGithoneyMintingPolicy, buildGithoneyValidator } from "../scripts";
import { Data, fromText, toUnit } from "lucid-cardano";
import { NetConfig, Roles } from "../utils";

async function createBounty(
  maintainerAddr: string,
  amount: bigint,
  netConfig: NetConfig
) {
  console.debug("START createBounty");
  const lucid = netConfig.lucidAdmin!;
  const gitHoneyValidator = buildGithoneyValidator();
  const validatorAddress = lucid.utils.validatorToAddress(gitHoneyValidator);
  const utxo = (await lucid.utxosAt(maintainerAddr))[0];
  const outRef = { txHash: utxo.txHash, outputIndex: utxo.outputIndex };
  const mintingScript = buildGithoneyMintingPolicy(outRef);
  const mintingPolicyid = lucid.utils.mintingPolicyToId(mintingScript);
  const githoneyUnit = toUnit(mintingPolicyid, fromText("githoney"));
  const mintAssets = {
    [toUnit(mintingPolicyid, fromText(Roles.ADMIN))]: 1n,
    [toUnit(mintingPolicyid, fromText(Roles.CONTRIBUTOR))]: 1n,
    [toUnit(mintingPolicyid, fromText(Roles.MAINTAINER))]: 1n,
    [githoneyUnit]: 1n
  };
  const { [githoneyUnit]: _, ...mantainerAssets } = mintAssets;
  const maintainerPkh =
    lucid.utils.getAddressDetails(maintainerAddr).paymentCredential!.hash;
  const githoneyPkh = lucid.utils.getAddressDetails(
    await lucid.wallet.address()
  ).paymentCredential!.hash;

  console.debug("Maintainer Address", maintainerAddr);
  console.debug("Githoney Address", await lucid.wallet.address());
  // New tx to pay to the contract the minAda and mint the admin, githoney, developer and mantainer tokens
  console.debug("amount", amount);
  lucid.selectWalletFrom({ address: maintainerAddr });
  const tx = await lucid
    .newTx()
    .collectFrom([utxo])
    .payToContract(validatorAddress, Data.void(), { lovelace: amount })
    .payToAddress(maintainerAddr, mantainerAssets)
    .addSignerKey(maintainerPkh)
    .addSignerKey(githoneyPkh) // what if maintainer is the same as githoney? Error
    .mintAssets(mintAssets, Data.void())
    .attachMintingPolicy(mintingScript)
    .complete();

  lucid.selectWalletFromSeed(netConfig.SEED);
  const txCbor = (await tx.sign().complete()).toString();
  console.debug(`TxCbor ${txCbor}`);

  return { txCbor, mintingPolicyid };
}

export default createBounty;
