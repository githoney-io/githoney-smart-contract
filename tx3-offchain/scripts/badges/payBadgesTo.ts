import { ftAddr, githoneySeed } from "../../constants.ts";
import { payBadgesTo } from "../../operations/index.ts";
import { signSubmitAndWaitConfirmation } from "../../test/utils.ts";
import { Badge } from "../../types.ts";
import { logger, lucidBase as lucid } from "../../utils/utils.ts";

const badges: Badge[] = [
  {
    badgeName: "Express Pollinator",
    badgePolicy: "1855a70da3f8b041ff49a6ca063817598b1f7c72d4ef25a292e776f2",
    payAddress:
      "addr_test1qr52yp349zxalc7fzmd2dlruu9gpxmvrkvxvslyxpgpqkdpdanvqr0pyy3ne06uvxkaalx8ds4x55z9gq6znqp5p06xqma0nqs",
  },
];

for (const badge of badges) {
  const { payBadgesCbor } = await payBadgesTo(ftAddr, badge);
  if (payBadgesCbor) {
    logger.info(
      `Attempting to sign and submit transaction for badge ${badge.badgeName}...`,
    );
    lucid.selectWalletFromSeed(githoneySeed);
    await signSubmitAndWaitConfirmation(payBadgesCbor, lucid);
  }
}
