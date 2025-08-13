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
    description: "Updated description",
  },
  policyId: "c8e163afc42e7f490af16326cab6b8eb8183386f5415dfca2929f010",
};

const { deployBadgesCbor, newMetadatas } = await deployBadges(
  settingsUtxo,
  outRef,
  ftBadgeAmount,
  ftAddr,
  [metadata],
);
logger.debug("New Metadatas", JSON.stringify(newMetadatas));
lucidBase.selectWalletFromSeed(githoneySeed);
await signAndSubmit(deployBadgesCbor);
