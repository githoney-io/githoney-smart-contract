import dotenv from "dotenv";
import { describe, it } from "mocha";
import { Blockfrost, Lucid, fromText, toUnit } from "lucid-cardano";
import {
  assignContributor,
  claimBounty,
  createBounty,
  mergeBounty,
  addRewards
} from "../../src";
import {
  MIN_ADA,
  controlTokenName,
  creationFee,
  githoneyAddr,
  rewardFee
} from "../../src/constants";
import { signSubmitAndWaitConfirmation } from "../utils";
import { GithoneyDatum } from "../../src/types";
import { assert } from "console";
import { keyPairsToAddress, validatorParams } from "../../src/utils";
import { buildGithoneyMintingPolicy } from "../../src/scripts";
import logger from "../../src/logger";

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
logger.info(`GITHONEY address: ${creatorAddress}\n`);

const lucidContributor = await Lucid.new(blockfrost, "Preprod");
lucidContributor.selectWalletFromSeed(CONTRIBUTOR_SEED!);
const contributorAddr = await lucidContributor.wallet.address();
logger.info(`CONTRIBUTOR address: ${contributorAddr}\n`);

const lucidMaintainer = await Lucid.new(blockfrost, "Preprod");
lucidMaintainer.selectWalletFromSeed(MAINTAINER_SEED!);
const maintainerAddress = await lucidMaintainer.wallet.address();
logger.info(`MAINTAINER address: ${maintainerAddress}\n`);

describe("Integration tests", async () => {
  it("Demo Normal flow", async () => {
    const scriptParams = validatorParams(lucid);
    const mintingScript = buildGithoneyMintingPolicy(scriptParams);

    const mintingPolicyid = lucid.utils.mintingPolicyToId(mintingScript);
    const controlTokenUnit = toUnit(
      mintingPolicyid,
      fromText(controlTokenName)
    );

    // CREATE BOUNTY
    const tokenAPolicy =
      "bab31a281f888aa25f6fd7b0754be83729069d66ad76c98be4a06deb";
    const tokenAName = fromText("tokenA");
    const tokenAUnit = toUnit(tokenAPolicy, tokenAName);
    const reward = { unit: tokenAUnit, amount: 100n };
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

    logger.info(`Creating bounty ${bounty_id}`);
    const createTxId = await signSubmitAndWaitConfirmation(
      lucidMaintainer,
      createCbor
    );
    const createOutRef = { txHash: createTxId, outputIndex: 0 };
    const githoneyOutRef = { txHash: createTxId, outputIndex: 1 };
    const [githoneyUtxo] = await lucid.utxosByOutRef([githoneyOutRef]);
    const [createUtxo] = await lucid.utxosByOutRef([createOutRef]);
    const createDatum = await lucid.datumOf(createUtxo, GithoneyDatum);

    const utxoAssets = {
      lovelace: 3_000_000n, // Min ADA
      [controlTokenUnit]: 1n,
      [tokenAUnit]: 100n
    };

    assert(createDatum.bounty_id === fromText(bounty_id), "Bounty id mismatch");
    assert(createDatum.deadline === deadline, "Deadline mismatch");
    assert(
      githoneyUtxo.assets["lovelace"] === creationFee,
      "Githoney payment wrong"
    );
    Object.entries(createUtxo.assets).forEach(([k, v]) => {
      assert(
        utxoAssets[k] === v,
        `Asset mismatch ${k}: ${v} !== ${utxoAssets[k]}`
      );
    });

    // ADD REWARDS
    const addRewardCbor = await addRewards(
      createOutRef,
      maintainerAddress,
      { unit: "lovelace", amount: 20_000_000n },
      lucid
    );

    logger.info(`Adding reward to bounty`);
    const addRewardTxId = await signSubmitAndWaitConfirmation(
      lucidMaintainer,
      addRewardCbor
    );
    const addRewatdOutRef = { txHash: addRewardTxId, outputIndex: 0 };
    const [addRewardUtxo] = await lucid.utxosByOutRef([addRewatdOutRef]);
    assert(
      addRewardUtxo.assets["lovelace"] === 23_000_000n,
      `Reward mismatch ${addRewardUtxo.assets["lovelace"]} !== 23_000_000n`
    );

    // ASSIGN CONTRIBUTOR
    logger.info(`Assigning contributor with addr ${contributorAddr}`);
    const assignCbor = await assignContributor(
      { txHash: addRewardTxId, outputIndex: 0 },
      contributorAddr,
      lucid
    );
    const assignTxId = await signSubmitAndWaitConfirmation(
      lucidContributor,
      assignCbor
    );

    const assignOutRef = { txHash: assignTxId, outputIndex: 0 };
    const [assignUtxo] = await lucid.utxosByOutRef([assignOutRef]);
    const assignDatum = await lucid.datumOf(assignUtxo, GithoneyDatum);

    assert(assignDatum.merged === false, "Merged mismatch");
    assert(
      (await keyPairsToAddress(lucid, assignDatum.contributor!)) ===
        contributorAddr,
      `Contributor mismatch: ${assignDatum.contributor} !== ${contributorAddr}`
    );
    assert(
      assignUtxo.assets["lovelace"] === 26_000_000n,
      `Lovelace in asset mismatch ${assignUtxo.assets["lovelace"]} !== 26_000_000`
    ); // contributor Min ADA

    // MERGE BOUNTY
    logger.info(`Merging bounty`);
    const mergeCbor = await mergeBounty(
      { txHash: assignTxId, outputIndex: 0 },
      lucid
    );
    const mergeTxId = await signSubmitAndWaitConfirmation(
      lucidGithoney,
      mergeCbor
    );

    const mergeOutRef = { txHash: mergeTxId, outputIndex: 0 };
    const [mergeUtxo] = await lucid.utxosByOutRef([mergeOutRef]);
    const mergeDatum = await lucid.datumOf(mergeUtxo, GithoneyDatum);

    const lovelaceReward = (20_000_000n * (10_000n - rewardFee)) / 10_000n;
    const tokenAReward = (100n * (10_000n - rewardFee)) / 10_000n;
    assert(mergeDatum.merged === true, "Merged mismatch");
    assert(
      mergeUtxo.assets["lovelace"] === lovelaceReward + MIN_ADA,
      `Lovelace mismatch ${mergeUtxo.assets["lovelace"]} !== ${lovelaceReward}`
    );
    assert(
      mergeUtxo.assets[tokenAUnit] === tokenAReward,
      `Token A mismatch ${mergeUtxo.assets[tokenAUnit]} !== ${tokenAReward}`
    );

    // CLAIM BOUNTY
    logger.info(`Claiming bounty`);
    const claimCbor = await claimBounty(
      { txHash: mergeTxId, outputIndex: 0 },
      lucid,
      contributorAddr
    );
    const claimTxId = await signSubmitAndWaitConfirmation(
      lucidContributor,
      claimCbor
    );

    const claimOutRef = { txHash: claimTxId, outputIndex: 0 };
    const [claimUtxo] = await lucid.utxosByOutRef([claimOutRef]);
    assert(
      claimUtxo.assets["lovelace"] === lovelaceReward + MIN_ADA,
      `Lovelace mismatch ${claimUtxo.assets["lovelace"]} !== ${lovelaceReward}`
    );
    assert(
      claimUtxo.assets[tokenAUnit] === tokenAReward,
      `Token A mismatch ${claimUtxo.assets[tokenAUnit]} !== ${tokenAReward}`
    );
  });
});
