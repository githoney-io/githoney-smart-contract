import { ftAddr, githoneySeed } from "../../constants.ts";
import { payBadgesTo } from "../../operations/index.ts";
import { signSubmitAndWaitConfirmation } from "../../test/utils.ts";
import { Badge } from "../../types.ts";
import { logger, lucidBase as lucid } from "../../utils/utils.ts";

const badges: Badge[] = [
  // TODO - complete with actual badge data
  {
    badgeName: "Express Pollinator",
    badgePolicy: "policy1",
    payAddress: "addr1",
  },
  {
    badgeName: "Community Contributor",
    badgePolicy: "policy2",
    payAddress: "addr2",
  },
];

for (const badge of badges) {
  const { payBadgesCbor } = await payBadgesTo(ftAddr, badge);
  logger.info(
    `Attempting to sign and submit transaction for badge ${badge.badgeName}...`,
  );
  lucid.selectWalletFromSeed(githoneySeed);
  await signSubmitAndWaitConfirmation(payBadgesCbor, lucid);
}
