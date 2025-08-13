import { githoneySeed, settingsRef } from "../../constants.ts";
import { collectUtxos } from "../../operations/index.ts";
import { MetadataWithPolicy } from "../../types.ts";
import { lucidBase as lucid, signAndSubmit } from "../../utils/utils.ts";

const [settingsUtxo] = await lucid.utxosByOutRef([settingsRef]);
const outRef = {
  txHash: "26ef8bda1195c485a712b4c29d00e4cd7b70ddb159d21565ab3b47dc22e3d56b",
  outputIndex: 0,
};
const metadatas: MetadataWithPolicy[] = [
  // TODO - complete with actual badge metadata information
  {
    metadata: {
      name: "Express Pollinator",
      logo: "https://githoney.io/assets/badges/small/express-pollinator_400.webp",
      description:
        "Given to a contributor who completes a bounty within 24h of accepting the bounty.",
    },
    policyId: "policy1",
  },
];

const { collectCbor } = await collectUtxos(settingsUtxo, outRef, metadatas);
lucid.selectWalletFromSeed(githoneySeed);
await signAndSubmit(collectCbor, lucid);
