import { createBounty } from "./operations/bounties/create";
import { closeBounty } from "./operations/bounties/close";
import { mergeBounty } from "./operations/bounties/merge";
import { claimBounty } from "./operations/bounties/claim";
import { addRewards } from "./operations/bounties/addRewards";
import { assignContributor } from "./operations/bounties/assignContributor";
import { deploy } from "./operations/settings/deploy";
import { update } from "./operations/settings/update";
import { closeSettings } from "./operations/settings/close";

export {
  createBounty,
  closeBounty,
  mergeBounty,
  assignContributor,
  claimBounty,
  addRewards,
  deploy,
  update,
  closeSettings
};
