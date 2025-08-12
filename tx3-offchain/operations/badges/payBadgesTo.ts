import { toUnit, fromText, fromUnit } from "@spacebudz/lucid";
import { protocol } from "../../gen/typescript/protocol.ts";
import { logger, lucidBase as lucid } from "../../utils/utils.ts";
import { Badge } from "../../types.ts";

/**
 * Builds a transaction on the context of the ftAddress and pays the badges requested.
 * @param ftAddress The address of the wallet holding the FT badges tokens.
 * @param badges The badges to be paid and where.
 * @returns The cbor of the unsigned transaction.
 */

async function payBadgesTo(
  ftAddress: string,
  badge: Badge,
): Promise<{ payBadgesCbor: string }> {
  logger.info("START payBadgeTo");

  lucid.selectReadOnlyWallet({ address: ftAddress });
  const { badgeName, badgePolicy } = badge;
  logger.info(`paying badge ${badgeName} to ${badge.payAddress}`);

  const utxos = await lucid.wallet.getUtxos();
  const badgeUnit = toUnit(badgePolicy, fromText(badgeName), 333);
  const badgeAssetName = fromUnit(badgeUnit).assetName;

  const ftUtxo = utxos.find((utxo) =>
    Object.keys(utxo.assets).find((unit) => unit === badgeUnit),
  );
  const userUtxos = await lucid.utxosAt(badge.payAddress);
  const userFtUtxo = userUtxos.find((utxo) =>
    Object.keys(utxo.assets).find((unit) => unit === badgeUnit),
  );

  if (!ftUtxo) {
    logger.error("Badge not found in badges wallet");
    return { payBadgesCbor: "" };
  }
  if (userFtUtxo) {
    logger.error(
      `Badge ${badgeName} already in user wallet ${badge.payAddress}`,
    );
    return { payBadgesCbor: "" };
  }

  const { tx } = await protocol.payBadgesToTx({
    badgename: {
      type: "Bytes",
      value: Buffer.from(badgeAssetName!, "hex"),
    },
    badgepolicy: {
      type: "Bytes",
      value: Buffer.from(badgePolicy, "hex"),
    },
    ftaddress: { type: "String", value: ftAddress },
    payaddress: { type: "String", value: badge.payAddress },
  });

  logger.info("END payBadgeTo");
  return { payBadgesCbor: tx };
}

export { payBadgesTo };
