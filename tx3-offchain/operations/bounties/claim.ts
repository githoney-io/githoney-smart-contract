import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, fromUnit, Lucid, OutRef, Utxo } from "@spacebudz/lucid";
import {
  extractBountyIdTokenUnit,
  keyPairsToAddress,
  logger,
  lucidBase,
} from "../../utils/utils.ts";
import { collateralOutRef } from "../../utils/utxo.ts";
import { GithoneyDatumSchema } from "../../types.ts";

async function claimBounty(
  settingsUtxo: Utxo,
  utxoRef: OutRef,
  lucid: Lucid,
): Promise<{
  claimCbor: string;
}> {
  logger.info("START claim");

  if (!settingsUtxo.scriptRef) {
    throw new Error("Githoney validator not found");
  }
  const scriptHash = Addresses.scriptToCredential(settingsUtxo.scriptRef).hash;

  const [selectedUtxos] = await collateralOutRef(lucid);
  const collateralref = selectedUtxos.txHash + "#" + selectedUtxos.outputIndex;

  const [bountyUtxo] = await lucidBase.utxosByOutRef([utxoRef]);
  const bountyRef = bountyUtxo.txHash + "#" + bountyUtxo.outputIndex;

  const bountyDatum = await lucidBase.datumOf(bountyUtxo, GithoneyDatumSchema);
  if (!bountyDatum.contributorAddress) {
    throw new Error("Bounty doesn't have a contributor");
  }
  if (!bountyDatum.merged) {
    throw new Error("Bounty is not merged");
  }
  const contributorAddr = keyPairsToAddress(
    lucidBase.network,
    bountyDatum.contributorAddress,
  );

  const now = new Date().getTime() - 60 * 1000;
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();

  const bountyIdTokenUnit = extractBountyIdTokenUnit(
    bountyUtxo.assets,
    scriptHash,
  );

  const { tx } = await protocol.claimTx({
    bountyid: Buffer.from(fromUnit(bountyIdTokenUnit).name!, "hex"),
    bountyref: bountyRef,
    collateralref: collateralref,
    contributor: contributorAddr,
    mintingpolicyid: Buffer.from(fromUnit(bountyIdTokenUnit).policyId, "hex"),
    settingsref: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
    since: BigInt(lucidBase.utils.unixTimeToSlots(now)),
    until: BigInt(lucidBase.utils.unixTimeToSlots(sixHoursFromNow)),
  });
  logger.info("END claim");
  return {
    claimCbor: tx,
  };
}

export { claimBounty };
