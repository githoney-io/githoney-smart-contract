import dotenv from "dotenv";
import { describe, it } from "mocha";
import { Blockfrost, Lucid, fromText, toText, toUnit } from "lucid-cardano";
import { assignContributor, claim, createBounty, mergeBounty } from "../../src";
import { githoneyAddr } from "../../src/constants";
import { signSubmitAndWaitConfirmation } from "../utils";

dotenv.config();
const {
  BLOCKFROST_PROJECT_ID,
  CONTRIBUTOR_SEED,
  MAINTAINER_SEED,
  GITHONEY_SEED
} = process.env;

const blockfrost = new Blockfrost(
  "https://cardano-preprod.blockfrost.io/api/v0",
  BLOCKFROST_PROJECT_ID
);
const lucid = await Lucid.new(blockfrost, "Preprod");

const lucidGithoney = await Lucid.new(blockfrost, "Preprod");
lucidGithoney.selectWalletFromSeed(GITHONEY_SEED!);
const creatorAddress = await lucidGithoney.wallet.address();
console.debug(`GITHONEY address: ${creatorAddress}\n`);

const lucidContributor = await Lucid.new(blockfrost, "Preprod");
lucidContributor.selectWalletFromSeed(CONTRIBUTOR_SEED!);
const contributorAddr = await lucidContributor.wallet.address();
console.debug(`CONTRIBUTOR address: ${contributorAddr}\n`);

const lucidMaintainer = await Lucid.new(blockfrost, "Preprod");
lucidMaintainer.selectWalletFromSeed(MAINTAINER_SEED!);
const maintainerAddress = await lucidMaintainer.wallet.address();
console.debug(`MAINTAINER address: ${maintainerAddress}\n`);

describe("Integration tests", async () => {
  it("Normal flow", async () => {
    const tokenAPolicy =
      "bab31a281f888aa25f6fd7b0754be83729069d66ad76c98be4a06deb";
    const tokenAName = fromText("tokenA");
    const tokenAUnit = toUnit(tokenAPolicy, tokenAName);
    const reward = { unit: tokenAPolicy, amount: 10000n };
    const deadline = BigInt(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime()
    );
    const bounty_id = "Bounty DEMO";
    const createCbor = await createBounty(
      maintainerAddress,
      githoneyAddr,
      reward,
      deadline,
      bounty_id,
      lucid
    );

    console.debug(`Creating bounty ${bounty_id} with rewards ${reward}`);
    const createTxId = await signSubmitAndWaitConfirmation(lucid, createCbor);

    console.debug(`Assigning contributor with addr ${contributorAddr}`);
    const assignCbor = await assignContributor(
      { txHash: createTxId, outputIndex: 0 },
      contributorAddr,
      lucid
    );
    const assignTxId = await signSubmitAndWaitConfirmation(
      lucidContributor,
      assignCbor
    );

    console.debug(`Merging bounty`);
    const mergeCbor = await mergeBounty(
      { txHash: assignTxId, outputIndex: 0 },
      lucid
    );
    const mergeTxId = await signSubmitAndWaitConfirmation(
      lucidGithoney,
      mergeCbor
    );

    console.debug(`Claiming bounty`);
    const claimCbor = await claim(
      { txHash: mergeTxId, outputIndex: 0 },
      lucid,
      contributorAddr
    );
    const claimTxId = await signSubmitAndWaitConfirmation(
      lucidContributor,
      claimCbor
    );
  });
});
