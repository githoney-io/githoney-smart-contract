import { ftAddr, githoneySeed, settingsRef } from "../../constants.ts";
import { deployBadges } from "../../operations/index.ts";
import { MetadataWithPolicy } from "../../types.ts";
import { logger, lucidBase, signAndSubmit } from "../../utils/utils.ts";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);
const outRef = {
  txHash: "26ef8bda1195c485a712b4c29d00e4cd7b70ddb159d21565ab3b47dc22e3d56b",
  outputIndex: 0,
};
const ftBadgeAmount = 3n;
const metadata: MetadataWithPolicy = {
  metadata: {
    name: "Express Pollinator",
    logo: "https://githoney.io/assets/badges/small/express-pollinator_400.webp",
    description:
      "Given to a contributor who completes a bounty within 24h of accepting the bounty.",
  },
};

const { deployBadgesCbor, newMetadatas } = await deployBadges(
  settingsUtxo,
  outRef,
  ftBadgeAmount,
  ftAddr,
  [metadata],
);
logger.info("Metadata", JSON.stringify(newMetadatas));
console.log(deployBadgesCbor);
// lucidBase.selectWalletFromSeed(githoneySeed);
// await signAndSubmit(deployBadgesCbor);
