import { Lucid, toUnit, fromText } from "lucid-txpipe";
import logger from "../../logger";

async function payBadgesTo(
  ftAddress: string,
  payAddress: string, // this info should be in the badges for more general use
  badges: { badgeName: string; badgePolicy: string }[],
  lucid: Lucid
) {
  logger.info("START payBadgeTo");
  let returnCbor = false;
  const tx = lucid.newTx();
  lucid.selectWalletFrom({ address: ftAddress });
  for (const badge of badges) {
    const { badgeName, badgePolicy } = badge;
    logger.info(`paying badge ${badgeName} to ${payAddress}`);
    const utxos = await lucid.wallet.getUtxos();
    const badgeUnit = toUnit(badgePolicy, fromText(badgeName), 333);
    const ftUtxo = utxos.find((utxo) =>
      Object.keys(utxo.assets).find((unit) => unit === badgeUnit)
    );
    const userUtxos = await lucid.utxosAt(payAddress);
    const userFtUtxo = userUtxos.find((utxo) =>
      Object.keys(utxo.assets).find((unit) => unit === badgeUnit)
    );
    if (!ftUtxo) {
      logger.error("Badge not found in badges wallet");
      continue;
    }
    if (userFtUtxo) {
      logger.error(`Badge ${badgeName} already in user wallet ${payAddress}`);
      continue;
    }
    tx.payToAddress(payAddress, { [badgeUnit]: 1n });
    returnCbor = true;
  }

  const txComplete = await tx.complete();
  logger.info("END payBadgeTo");
  if (returnCbor) {
    return txComplete.toString();
  }
}

export { payBadgesTo };
