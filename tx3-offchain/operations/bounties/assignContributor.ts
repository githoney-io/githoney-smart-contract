import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, OutRef, Utxo } from "@spacebudz/lucid";
import { logger, lucidBase } from "../../utils/utils.ts";
import { MIN_ADA } from "../../constants.ts";
import { GithoneyDatumSchema } from "../../types.ts";

async function assignContributor(
  contributorAddr: string,
  settingsUtxo: Utxo,
  utxoRef: OutRef,
): Promise<{
  assignCbor: string;
}> {
  logger.info("START assign");

  if (!settingsUtxo.scriptRef) {
    throw new Error("Githoney validator not found");
  }
  const scriptAddress = lucidBase.utils.scriptToAddress(settingsUtxo.scriptRef);

  const [bountyUtxo] = await lucidBase.utxosByOutRef([utxoRef]);
  const bountyRef = bountyUtxo.txHash + "#" + bountyUtxo.outputIndex;

  const oldDatum = await lucidBase.datumOf(bountyUtxo, GithoneyDatumSchema);
  if (oldDatum.merged) {
    throw new Error("Bounty already merged");
  }
  if (oldDatum.deadline < Date.now()) {
    throw new Error("Bounty deadline passed");
  }
  if (oldDatum.contributorAddress) {
    throw new Error("Bounty already has a contributor");
  }

  const contributorPaymentCred =
    Addresses.inspect(contributorAddr).payment?.hash;
  const contributorStakeCred =
    Addresses.inspect(contributorAddr).delegation?.hash || null;

  const now = new Date().getTime() - 60 * 1000;
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();

  const { tx } = await protocol.assignTx({
    bountyref: bountyRef,
    contributor: contributorAddr,
    contributorpaymentcredential: Buffer.from(contributorPaymentCred!, "hex"),
    contributorstakecredential: Buffer.from(contributorStakeCred!, "hex"),
    minada: BigInt(MIN_ADA),
    script: scriptAddress,
    settingsref: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
    since: BigInt(lucidBase.utils.unixTimeToSlots(now)),
    until: BigInt(lucidBase.utils.unixTimeToSlots(sixHoursFromNow)),
  });

  logger.info("END assign");
  return {
    assignCbor: tx,
  };
}

export { assignContributor };
