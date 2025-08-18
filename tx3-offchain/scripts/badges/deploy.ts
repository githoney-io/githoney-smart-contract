import {
  ftAddr,
  githoneySeed,
  settingsNftRef,
  settingsRef,
} from "../../constants.ts";
import { deployBadges } from "../../operations/index.ts";
import { MetadataWithPolicy } from "../../types.ts";
import { logger, lucidBase, signAndSubmit } from "../../utils/utils.ts";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);
const ftBadgeAmount = 3n;
const metadata: MetadataWithPolicy = {
  metadata: {
    name: "Express Pollinator",
    logo: "https://githoney.io/assets/badges/small/express-pollinator_400.webp",
    description: "Updated description",
  },
  policyId: "1855a70da3f8b041ff49a6ca063817598b1f7c72d4ef25a292e776f2",
};

const { deployBadgesCbor, newMetadata } = await deployBadges(
  settingsUtxo,
  settingsNftRef,
  ftBadgeAmount,
  ftAddr,
  metadata,
);
logger.debug("New Metadata", JSON.stringify(newMetadata));
lucidBase.selectWalletFromSeed(githoneySeed);
await signAndSubmit(deployBadgesCbor);
