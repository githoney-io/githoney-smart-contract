import { buildGithoneyMintingPolicy, buildGithoneyValidator } from "../scripts";
import { ControlTokenName, MIN_ADA, rewardFee } from "../constants";
import {
  GithoneyDatum,
  GithoneyDatumT,
  GithoneyValidatorRedeemer,
  mkDatum
} from "../types";
import { Data, fromText, toUnit, OutRef, Lucid } from "lucid-cardano";
import { validatorParams } from "../utils";

async function mergeBounty(
  ref_input: OutRef,
  maintainerAddr: string,
  adminAddr: string,
  lucid: Lucid
) {
  console.debug("START mergeBounty");
  const githoneyAddr = process.env.GITHONEY_ADDR!;
  const scriptParams = validatorParams(lucid);

  const gitHoneyValidator = buildGithoneyValidator(scriptParams);
  const validatorAddress = lucid.utils.validatorToAddress(gitHoneyValidator);
  const [contractUtxo] = await lucid.utxosByOutRef([ref_input]);
  const bountyDatum = Data.from<GithoneyDatumT>(
    contractUtxo.datum as string,
    GithoneyDatum as unknown as GithoneyDatumT
  );

  const newBountyDatum: string = mkDatum(
    bountyDatum.admin,
    bountyDatum.maintainer,
    bountyDatum.deadline,
    bountyDatum.bounty_id,
    true
  );

  const utxo = (await lucid.wallet.getUtxos())[0];
  const mintingScript = buildGithoneyMintingPolicy(scriptParams);
  const mintingPolicyid = lucid.utils.mintingPolicyToId(mintingScript);

  const feePercent = BigInt(rewardFee) / 10000n;
  const assets = contractUtxo.assets;

  const githoneyRewards = Object.fromEntries(
    Object.entries(assets).map(([asset, amount]) => {
      if (asset === "lovelace") {
        return [asset, amount - 2n * MIN_ADA];
      } else {
        return [asset, amount * feePercent];
      }
    })
  );
  const bountyRewards = Object.fromEntries(
    Object.entries(assets).map(([asset, amount]) => {
      if (asset === "lovelace") {
        return [asset, amount - 2n * MIN_ADA];
      } else {
        return [asset, amount * (1n - feePercent)];
      }
    })
  );

  const tx = await lucid
    .newTx()
    .readFrom([utxo])
    .collectFrom([contractUtxo], GithoneyValidatorRedeemer.Merge())
    .payToContract(
      validatorAddress,
      { inline: newBountyDatum },
      {
        ...bountyRewards,
        [toUnit(mintingPolicyid, fromText(ControlTokenName))]: 1n
      }
    )
    .payToAddress(maintainerAddr, { lovelace: MIN_ADA })
    .payToAddress(githoneyAddr, { ...githoneyRewards })
    .complete();

  lucid.selectWalletFrom({ address: adminAddr });
  const txSigned = await tx.sign().complete();

  console.debug("END mergeBounty");
  return txSigned.toString();
}

export default mergeBounty;
