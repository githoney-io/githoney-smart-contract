import { buildGithoneyMintingPolicy, buildGithoneyValidator } from "../scripts";
import { MIN_ADA, NetConfig } from "../constants";
import { Data, fromText, toUnit, OutRef } from "lucid-cardano";

async function mergeBounty(
  ref_input: OutRef,
  maintainerAddr: string,
  netConfig: NetConfig
) {
  console.debug("START mergeBounty");
  const lucid = netConfig.lucidAdmin!;
  const gitHoneyValidator = buildGithoneyValidator();
  const validatorAddress = lucid.utils.validatorToAddress(gitHoneyValidator);
  const [contractUtxo] = await lucid.utxosByOutRef([ref_input]);
  const bountyDatum = Data.from<BountyDatumT>(
    contractUtxo.datum as string,
    BountyDatum as unknown as BountyDatumT
  );
  const newBountyDatum = {
    ...bountyDatum,
    merged: true
  };

  const githoneyAdrr = await lucid.wallet.address();
  const utxo = (await lucid.wallet.getUtxos())[0];
  const outRef = { txHash: utxo.txHash, outputIndex: utxo.outputIndex };
  const mintingScript = buildGithoneyMintingPolicy(outRef);
  const mintingPolicyid = lucid.utils.mintingPolicyToId(mintingScript);
  const githoneyUnit = toUnit(mintingPolicyid, fromText("githoney"));

  // Your code here

  // Your return object here
  const tx = await lucid
    .newTx()
    // .collectFrom(utxos)
    // .collectFrom(contractUtxo, CapsuleValidatorRedeemer.Deposit())
    // .attachSpendingValidator(gitHoneyValidator)
    .payToContract(validatorAddress, { inline: newBountyDatum }, {})
    .payToAddress(maintainerAddr, { lovelace: MIN_ADA })
    .payToAddress(githoneyAdrr, {})
    .complete();

  lucid.selectWalletFromSeed(netConfig.SEED);
  const txSigned = await tx.sign().complete();

  console.debug("END mergeBounty");
  return txSigned.toString();
}

export default mergeBounty;
