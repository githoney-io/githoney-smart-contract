import dotenv from "dotenv";
import { describe, it } from "@jest/globals";
import {
  Addresses,
  Blockfrost,
  Lucid,
  fromText,
  fromUnit,
  toUnit,
} from "@spacebudz/lucid";
import {
  assignContributor,
  claimBounty,
  createBounty,
  mergeBounty,
  addRewards,
  deploySettings,
  updateSettings,
  closeSettings,
} from "../../operations/index.ts";
import {
  MIN_ADA,
  adminAddr,
  creationFee,
  githoneyAddr,
  rewardFee,
} from "../../constants.ts";
import {
  outRefWithErrorCatching,
  signSubmitAndWaitConfirmation,
} from "../utils.ts";
import { assert } from "console";
import {
  GithoneyDatumSchema,
  githoneyMintingPolicy,
  SettingsDatumSchema,
} from "../../types.ts";
import { keyPairsToAddress, logger } from "../../utils/utils.ts";

dotenv.config();
const {
  PREPROD_BLOCKFROST_PROJECT_ID,
  CONTRIBUTOR_SEED,
  MAINTAINER_SEED,
  GITHONEY_SEED,
} = process.env;

const blockfrost = new Blockfrost(
  process.env.BLOCKFROST_URL as string,
  PREPROD_BLOCKFROST_PROJECT_ID,
);
const lucid = new Lucid({ provider: blockfrost, network: "Preprod" });

const lucidGithoney = new Lucid({ provider: blockfrost, network: "Preprod" });
lucidGithoney.selectWalletFromSeed(GITHONEY_SEED!);
const creatorAddress = await lucidGithoney.wallet.address();
logger.info(`GITHONEY address: ${creatorAddress}\n`);

const lucidContributor = new Lucid({
  provider: blockfrost,
  network: "Preprod",
});
lucidContributor.selectWalletFromSeed(CONTRIBUTOR_SEED!);
const contributorAddr = await lucidContributor.wallet.address();
logger.info(`CONTRIBUTOR address: ${contributorAddr}\n`);

const lucidMaintainer = new Lucid({
  provider: blockfrost,
  network: "Preprod",
});
lucidMaintainer.selectWalletFromSeed(MAINTAINER_SEED!);
const maintainerAddress = await lucidMaintainer.wallet.address();
logger.info(`MAINTAINER address: ${maintainerAddress}\n`);

const tokenDPolicy = "fb279c09175731ade05f7314a9b36cf923c7a3d6873be26bbd1eeccf";
const tokenDName = "tokenD";
const tokenDUnit = toUnit(tokenDPolicy, tokenDName);
const bounty_id = "Bounty DEMO";

describe("Integration tests", () => {
  it("Demo Normal flow", async () => {
    const { deployCbor } = await deploySettings(githoneyAddr);
    logger.info(`Deploying Githoney`);
    const deployTxId = await signSubmitAndWaitConfirmation(
      deployCbor,
      lucidGithoney,
    );
    const deployOutRef = { txHash: deployTxId, outputIndex: 0 };
    const settingsUtxo = await outRefWithErrorCatching(deployOutRef, lucid);

    logger.info(`Githoney deployed`);
    let settingsNFTPolicy = "";
    Object.keys(settingsUtxo.assets).forEach((unit) => {
      if (fromUnit(unit).policyId !== "") {
        settingsNFTPolicy = fromUnit(unit).policyId;
      }
    });
    const mintingScript = githoneyMintingPolicy(settingsNFTPolicy);

    const mintingPolicyid = Addresses.scriptToCredential(mintingScript).hash;
    const bountyIdTokenUnit = toUnit(mintingPolicyid, fromText(bounty_id));

    // CREATE BOUNTY

    const deadline = BigInt(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime(),
    );

    const { createCbor } = await createBounty(
      tokenDPolicy,
      tokenDName,
      100n,
      bounty_id,
      maintainerAddress,
      adminAddr,
      settingsUtxo,
      BigInt(deadline),
    );

    logger.info(`Creating bounty ${bounty_id}`);
    const createTxId = await signSubmitAndWaitConfirmation(
      createCbor,
      lucidMaintainer,
    );
    const createOutRef = { txHash: createTxId, outputIndex: 0 };
    const githoneyOutRef = { txHash: createTxId, outputIndex: 1 };
    const [githoneyUtxo] = await lucid.utxosByOutRef([githoneyOutRef]);
    const createUtxo = await outRefWithErrorCatching(createOutRef, lucid);
    const createDatum = await lucid.datumOf(createUtxo, GithoneyDatumSchema);

    const utxoAssets = {
      lovelace: 3_000_000n, // Min ADA
      [bountyIdTokenUnit]: 1n,
      [tokenDUnit]: 100n,
    };

    assert(createDatum.deadline === deadline, "Deadline mismatch");
    assert(
      githoneyUtxo.assets["lovelace"] === creationFee,
      "Githoney payment wrong",
    );
    Object.entries(createUtxo.assets).forEach(([k, v]) => {
      assert(
        utxoAssets[k] === v,
        `Asset mismatch ${k}: ${v} !== ${utxoAssets[k]}`,
      );
    });

    // ADD REWARDS
    const { addRewardCbor } = await addRewards(
      200n,
      settingsUtxo,
      maintainerAddress,
      createOutRef,
    );

    logger.info(`Adding reward to bounty`);
    const addRewardTxId = await signSubmitAndWaitConfirmation(
      addRewardCbor,
      lucidMaintainer,
    );
    const addRewatdOutRef = { txHash: addRewardTxId, outputIndex: 0 };
    const addRewardUtxo = await outRefWithErrorCatching(addRewatdOutRef, lucid);
    assert(
      addRewardUtxo.assets["lovelace"] === 23_000_000n,
      `Reward mismatch ${addRewardUtxo.assets["lovelace"]} !== 23_000_000n`,
    );

    // ASSIGN CONTRIBUTOR
    logger.info(`Assigning contributor with addr ${contributorAddr}`);
    const { assignCbor } = await assignContributor(
      contributorAddr,
      settingsUtxo,
      { txHash: addRewardTxId, outputIndex: 0 },
    );
    const assignTxId = await signSubmitAndWaitConfirmation(
      assignCbor,
      lucidContributor,
    );

    const assignOutRef = { txHash: assignTxId, outputIndex: 0 };
    const assignUtxo = await outRefWithErrorCatching(assignOutRef, lucid);
    const assignDatum = await lucid.datumOf(assignUtxo, GithoneyDatumSchema);

    assert(assignDatum.merged === false, "Merged mismatch");
    assert(
      keyPairsToAddress("Preprod", assignDatum.contributorAddress!) ===
        contributorAddr,
      `Contributor mismatch: ${keyPairsToAddress(
        "Preprod",
        assignDatum.contributorAddress!,
      )} !== ${contributorAddr}`,
    );
    assert(
      assignUtxo.assets["lovelace"] === 26_000_000n,
      `Lovelace in asset mismatch ${assignUtxo.assets["lovelace"]} !== 26_000_000`,
    ); // contributor Min ADA

    // MERGE BOUNTY
    logger.info(`Merging bounty`);
    const { mergeCbor } = await mergeBounty(adminAddr, settingsUtxo, {
      txHash: assignTxId,
      outputIndex: 0,
    });
    const mergeTxId = await signSubmitAndWaitConfirmation(
      mergeCbor,
      lucidGithoney,
    );

    const mergeOutRef = { txHash: mergeTxId, outputIndex: 0 };
    const mergeUtxo = await outRefWithErrorCatching(mergeOutRef, lucid);
    const mergeDatum = await lucid.datumOf(mergeUtxo, GithoneyDatumSchema);

    const lovelaceReward = (20_000_000n * (10_000n - rewardFee)) / 10_000n;
    const tokenAReward = (100n * (10_000n - rewardFee)) / 10_000n;
    assert(mergeDatum.merged === true, "Merged mismatch");
    assert(
      mergeUtxo.assets["lovelace"] === lovelaceReward + MIN_ADA,
      `Lovelace mismatch ${mergeUtxo.assets["lovelace"]} !== ${lovelaceReward}`,
    );
    assert(
      mergeUtxo.assets[tokenDUnit] === tokenAReward,
      `Token A mismatch ${mergeUtxo.assets[tokenDUnit]} !== ${tokenAReward}`,
    );

    // CLAIM BOUNTY
    logger.info(`Claiming bounty`);
    const { claimCbor } = await claimBounty(settingsUtxo, {
      txHash: mergeTxId,
      outputIndex: 0,
    });
    const claimTxId = await signSubmitAndWaitConfirmation(
      claimCbor,
      lucidContributor,
    );

    const claimOutRef = { txHash: claimTxId, outputIndex: 0 };
    const claimUtxo = await outRefWithErrorCatching(claimOutRef, lucid);
    assert(
      claimUtxo.assets["lovelace"] === lovelaceReward + MIN_ADA,
      `Lovelace mismatch ${claimUtxo.assets["lovelace"]} !== ${lovelaceReward}`,
    );
    assert(
      claimUtxo.assets[tokenDUnit] === tokenAReward,
      `Token A mismatch ${claimUtxo.assets[tokenDUnit]} !== ${tokenAReward}`,
    );
  }, 900000);

  it("Demo with settings change", async () => {
    const { deployCbor, outRef: nftOutRef } = await deploySettings(
      githoneyAddr,
    );
    logger.info(`Deploying Githoney`);
    const deployTxId = await signSubmitAndWaitConfirmation(
      deployCbor,
      lucidGithoney,
    );
    const deployOutRef = { txHash: deployTxId, outputIndex: 0 };
    const settingsUtxo = await outRefWithErrorCatching(deployOutRef, lucid);
    const settingsDatum = await lucid.datumOf(
      settingsUtxo,
      SettingsDatumSchema,
    );

    logger.info(`Githoney deployed`);
    assert(settingsDatum.bountyCreationFee === creationFee);
    assert(settingsDatum.bountyRewardFee === rewardFee);
    assert(
      keyPairsToAddress("Preprod", settingsDatum.githoneyAddress) ===
        githoneyAddr,
    );

    // CREATE BOUNTY

    const deadline = BigInt(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime(),
    );

    const { createCbor } = await createBounty(
      tokenDPolicy,
      tokenDName,
      100n,
      bounty_id,
      maintainerAddress,
      adminAddr,
      settingsUtxo,
      deadline,
    );

    logger.info(`Creating bounty ${bounty_id}`);
    const createTxId = await signSubmitAndWaitConfirmation(
      createCbor,
      lucidMaintainer,
    );
    const createOutRef = { txHash: createTxId, outputIndex: 0 };
    const githoneyOutRef = { txHash: createTxId, outputIndex: 1 };
    const [githoneyUtxo] = await lucid.utxosByOutRef([githoneyOutRef]);
    const createUtxo = await outRefWithErrorCatching(createOutRef, lucid);
    const createDatum = await lucid.datumOf(createUtxo, GithoneyDatumSchema);

    assert(createDatum.bountyRewardFee === rewardFee);
    assert(
      githoneyUtxo.assets["lovelace"] === creationFee,
      "Githoney payment wrong",
    );

    const { updateCbor } = await updateSettings(settingsUtxo, {
      githoneyAddress: githoneyAddr,
      creationFee: 10_000_000n,
      rewardFee: 5_000n,
    });

    logger.info(`Updating settings`);
    const updateSettingsTxId = await signSubmitAndWaitConfirmation(
      updateCbor,
      lucidGithoney,
    );
    const updateSettingsOutRef = { txHash: updateSettingsTxId, outputIndex: 0 };
    const newSettingsUtxo = await outRefWithErrorCatching(
      updateSettingsOutRef,
      lucid,
    );
    const newSettingsDatum = await lucid.datumOf(
      newSettingsUtxo,
      SettingsDatumSchema,
    );

    assert(newSettingsDatum.bountyCreationFee === 10_000_000n);
    assert(newSettingsDatum.bountyRewardFee === 5_000n);
    assert(
      keyPairsToAddress("Preprod", newSettingsDatum.githoneyAddress) ===
        githoneyAddr,
    );

    const newCreateCbor = await createBounty(
      tokenDPolicy,
      tokenDName,
      100n,
      "Bounty DEMO 2",
      maintainerAddress,
      adminAddr,
      newSettingsUtxo,
      deadline,
    );

    logger.info(`Creating bounty Bounty DEMO 2`);
    const newCreateTxId = await signSubmitAndWaitConfirmation(
      newCreateCbor.createCbor,
      lucidMaintainer,
    );
    const newCreateOutRef = { txHash: newCreateTxId, outputIndex: 0 };
    const newGithoneyOutRef = { txHash: newCreateTxId, outputIndex: 1 };
    const newGithoneyUtxo = await outRefWithErrorCatching(
      newGithoneyOutRef,
      lucid,
    );
    const newCreateUtxo = await outRefWithErrorCatching(newCreateOutRef, lucid);

    const newCreateDatum = await lucid.datumOf(
      newCreateUtxo,
      GithoneyDatumSchema,
    );

    assert(newCreateDatum.bountyRewardFee === 5_000n);
    assert(
      newGithoneyUtxo.assets["lovelace"] === 10_000_000n,
      "Githoney payment wrong",
    );

    const { assignCbor } = await assignContributor(
      contributorAddr,
      newSettingsUtxo,
      newCreateOutRef,
    );

    logger.info(`Assigning contributor with addr ${contributorAddr}`);
    const assignTxId = await signSubmitAndWaitConfirmation(
      assignCbor,
      lucidContributor,
    );

    const assignOutRef = { txHash: assignTxId, outputIndex: 0 };

    const { mergeCbor } = await mergeBounty(
      adminAddr,
      newSettingsUtxo,
      assignOutRef,
    );

    logger.info(`Merging bounty`);
    const mergeTxId = await signSubmitAndWaitConfirmation(
      mergeCbor,
      lucidGithoney,
    );
    const mergeOutRef = { txHash: mergeTxId, outputIndex: 0 };
    const githoneyFeePayOutRef = { txHash: mergeTxId, outputIndex: 2 };
    const githoneyFeePayUtxo = await outRefWithErrorCatching(
      githoneyFeePayOutRef,
      lucid,
    );
    assert(
      githoneyFeePayUtxo.assets["lovelace"] === 15_000_000n / 2n,
      `Githoney fee pay mismatch ${githoneyFeePayUtxo.assets["lovelace"]}`,
    );
    assert(
      githoneyFeePayUtxo.assets[tokenDUnit] === 100n / 2n,
      `Githoney fee pay mismatch ${githoneyFeePayUtxo.assets[tokenDUnit]}`,
    );

    const { claimCbor } = await claimBounty(newSettingsUtxo, mergeOutRef);

    logger.info(`Claiming bounty`);
    await signSubmitAndWaitConfirmation(claimCbor, lucidContributor);

    const { closeCbor } = await closeSettings(newSettingsUtxo, nftOutRef);

    logger.info(`Closing settings`);
    const closeSettingsTxId = await signSubmitAndWaitConfirmation(
      closeCbor,
      lucidGithoney,
    );
    const githoneyPayOutRef = { txHash: closeSettingsTxId, outputIndex: 0 };
    const githoneyPayUtxo = await outRefWithErrorCatching(
      githoneyPayOutRef,
      lucid,
    );
    assert(
      newSettingsUtxo.assets["lovelace"] === githoneyPayUtxo.assets["lovelace"],
    );
  }, 900000);
});
