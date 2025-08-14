import { ftAddr, githoneySeed, settingsRef } from "../../constants.ts";
import { deployBadges } from "../../operations/index.ts";
import { MetadataWithPolicy } from "../../types.ts";
import { logger, lucidBase, signAndSubmit } from "../../utils/utils.ts";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);
const outRef = {
  txHash: "208fc648a97e8fc6b70d818f6a3b31db1ce15deb66a1e6df96a67a683c47933f",
  outputIndex: 1,
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

const { deployBadgesCbor, newMetadata } = await deployBadges(
  settingsUtxo,
  outRef,
  ftBadgeAmount,
  ftAddr,
  metadata,
);
logger.debug("New Metadata", JSON.stringify(newMetadata));
lucidBase.selectWalletFromSeed(githoneySeed);
await signAndSubmit(deployBadgesCbor);
