import { Lucid, toUnit, fromText } from "lucid-txpipe";
import logger from "../../logger";

async function payBadgesTo(
  ftAddress: string,
  badges: { badgeName: string; badgePolicy: string; payAddress: string }[],
  lucid: Lucid
) {
  logger.info("START payBadgeTo");
  let returnCbor = false;
  const tx = lucid.newTx();
  lucid.selectWalletFrom({ address: ftAddress });
  for (const badge of badges) {
    const { badgeName, badgePolicy } = badge;
    logger.info(`paying badge ${badgeName} to ${badge.payAddress}`);
    const utxos = await lucid.wallet.getUtxos();
    const badgeUnit = toUnit(badgePolicy, fromText(badgeName), 333);
    const ftUtxo = utxos.find((utxo) =>
      Object.keys(utxo.assets).find((unit) => unit === badgeUnit)
    );
    const userUtxos = await lucid.utxosAt(badge.payAddress);
    const userFtUtxo = userUtxos.find((utxo) =>
      Object.keys(utxo.assets).find((unit) => unit === badgeUnit)
    );
    if (!ftUtxo) {
      logger.error("Badge not found in badges wallet");
      continue;
    }
    if (userFtUtxo) {
      logger.error(
        `Badge ${badgeName} already in user wallet ${badge.payAddress}`
      );
      continue;
    }
    tx.payToAddress(badge.payAddress, { [badgeUnit]: 1n });
    returnCbor = true;
  }

  const txComplete = await tx.complete();
  logger.info("END payBadgeTo");
  if (returnCbor) {
    return txComplete.toString();
  }
}

export { payBadgesTo };
