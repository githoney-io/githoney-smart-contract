import { settingsNftRef, settingsRef } from "../../constants.ts";
import { collectUtxos } from "../../operations/index.ts";
import { MetadataWithPolicy } from "../../types.ts";
import { lucidBase as lucid } from "../../utils/utils.ts";

const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
const metadatas: MetadataWithPolicy[] = [
  {
    metadata: {
      name: "Express Pollinator",
      logo: "https://githoney.io/assets/badges/small/express-pollinator_400.webp",
      description:
        "Given to a contributor who completes a bounty within 24h of accepting the bounty.",
    },
    // policyId: "1855a70da3f8b041ff49a6ca063817598b1f7c72d4ef25a292e776f2",
  },
];

await collectUtxos(settingsUtxo, settingsNftRef, metadatas);
