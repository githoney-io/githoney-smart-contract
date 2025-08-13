import { ftAddr, githoneySeed } from "../../constants.ts";
import { payBadgesTo } from "../../operations/index.ts";
import { signSubmitAndWaitConfirmation } from "../../test/utils.ts";
import { Badge } from "../../types.ts";
import { logger, lucidBase as lucid } from "../../utils/utils.ts";

const badges: Badge[] = [
  // TODO - complete with actual badge data
  {
    badgeName: "Express Pollinator",
    badgePolicy: "1889f6656b22b63c13498f08d3514b6fbb8223e3329f157b7b993ff0",
    payAddress:
      "addr_test1qqzq2j55hh2ml3h08skfgg04lhh7n7epv2ycn90ntr6ys7zrxalmeg3lyamyahkfwdv6fylkyxj0stj8xpplusva7w7s40czuq",
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
