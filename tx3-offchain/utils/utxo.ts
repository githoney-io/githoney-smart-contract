import { Lucid, Utxo } from "@spacebudz/lucid";

/**
 * Union type for specifying sorting order in function "sortUTxOs"
 */
export type SortOrder =
  /**
   * Largest amount of "lovelace" with least number of unique assets first
   */
  | "LargestFirst"
  /**
   * Smallest amount of "lovelace" with least number of unique assets first
   */
  | "SmallestFirst"
  /**
   * Lexicographically sorted as per ledger rules
   */
  | "Canonical";

/**
 * Sorts an array of UTXOs according to specified sort order ("LargestFirst" by default).
 * The provided array is cloned and reference to the new sorted array is returned.
 *
 * @param {Utxo[]} utxos - The array of UTXO objects to be sorted.
 * @param {SortOrder} [order="LargestFirst"] - The order in which to sort the UTXOs.
 * @returns {Utxo[]} - The sorted array of UTXOs.
 *
 */
export const sortUTxOs = (
  utxos: Utxo[],
  order: SortOrder = "LargestFirst",
): Utxo[] => {
  switch (order) {
    case "LargestFirst":
      return [...utxos].sort(largestFirst);
    case "SmallestFirst":
      return [...utxos].sort(smallestFirst);
    case "Canonical":
      return [...utxos].sort(canonical);
  }
};

const largestFirst = (a: Utxo, b: Utxo) => {
  const lovelaceA = Number(a.assets["lovelace"]);
  const lovelaceB = Number(b.assets["lovelace"]);

  if (lovelaceA === lovelaceB) {
    return Object.keys(a.assets).length - Object.keys(b.assets).length;
  }
  return -1 * (lovelaceA - lovelaceB);
};

const smallestFirst = (a: Utxo, b: Utxo) => {
  const lovelaceA = Number(a.assets["lovelace"]);
  const lovelaceB = Number(b.assets["lovelace"]);

  if (lovelaceA == lovelaceB) {
    return Object.keys(a.assets).length - Object.keys(b.assets).length;
  }
  return lovelaceA - lovelaceB;
};

const canonical = (a: Utxo, b: Utxo) => {
  if (a.txHash < b.txHash) {
    return -1;
  } else if (a.txHash > b.txHash) {
    return 1;
  } else {
    return a.outputIndex - b.outputIndex;
  }
};

export const collateralOutRef = async (lucid: Lucid): Promise<Utxo[]> => {
  return await lucid.wallet
    .getUtxos()
    .then((utxos) => {
      return utxos.filter(
        (utxo) =>
          utxo.assets["lovelace"] >= 5_000_000 &&
          Object.keys(utxo.assets).length === 1,
      );
    })
    .then((utxos) => sortUTxOs(utxos, "Canonical"));
};
