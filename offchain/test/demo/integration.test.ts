import dotenv from "dotenv";
import { describe, it } from "mocha";
import { Blockfrost, Lucid, fromText, fromUnit, toUnit } from "lucid-txpipe";
import {
  assignContributor,
  claimBounty,
  createBounty,
  mergeBounty,
  addRewards,
  deploySettings,
  updateSettings,
  closeSettings
} from "../../src";
import {
  MIN_ADA,
  creationFee,
  githoneyAddr,
  rewardFee
} from "../../src/constants";
import {
  outRefWithErrorCatching,
  signSubmitAndWaitConfirmation
} from "../utils";
import { GithoneyDatum, SettingsDatum } from "../../src/types";
import { assert } from "console";
import { addrToWallet, keyPairsToAddress } from "../../src/utils";
import { githoneyMintingPolicy } from "../../src/scripts";
import logger from "../../src/logger";

dotenv.config();
const {
  PREPROD_BLOCKFROST_PROJECT_ID,
  CONTRIBUTOR_SEED,
  MAINTAINER_SEED,
  GITHONEY_SEED
} = process.env;

const blockfrost = new Blockfrost(
  "https://cardano-preprod.blockfrost.io/api/v0",
  PREPROD_BLOCKFROST_PROJECT_ID
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

const tokenAPolicy = "bab31a281f888aa25f6fd7b0754be83729069d66ad76c98be4a06deb";
const tokenAName = fromText("tokenA");
const tokenAUnit = toUnit(tokenAPolicy, tokenAName);
const bounty_id = "Bounty DEMO";

describe("Integration tests", async () => {
  it("Demo Normal flow", async () => {
    const { cbor: deployCbor } = await deploySettings(githoneyAddr, lucid);
    logger.info(`Deploying Githoney`);
    const deployTxId = await signSubmitAndWaitConfirmation(
      lucidGithoney,
      deployCbor
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

    const mintingPolicyid = lucid.utils.mintingPolicyToId(mintingScript);
    const bountyIdTokenUnit = toUnit(mintingPolicyid, fromText(bounty_id));

    // CREATE BOUNTY

    const reward = { [tokenAUnit]: 100n };
    const deadline = BigInt(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime()
    );

    const createCbor = await createBounty(
      settingsUtxo,
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
    const createUtxo = await outRefWithErrorCatching(createOutRef, lucid);
    const createDatum = await lucid.datumOf(createUtxo, GithoneyDatum);

    const utxoAssets = {
      lovelace: 3_000_000n, // Min ADA
      [bountyIdTokenUnit]: 1n,
      [tokenAUnit]: 100n
    };

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
      settingsUtxo,
      createOutRef,
      maintainerAddress,
      { lovelace: 20_000_000n },
      lucid
    );

    logger.info(`Adding reward to bounty`);
    const addRewardTxId = await signSubmitAndWaitConfirmation(
      lucidMaintainer,
      addRewardCbor
    );
    const addRewatdOutRef = { txHash: addRewardTxId, outputIndex: 0 };
    const addRewardUtxo = await outRefWithErrorCatching(addRewatdOutRef, lucid);
    assert(
      addRewardUtxo.assets["lovelace"] === 23_000_000n,
      `Reward mismatch ${addRewardUtxo.assets["lovelace"]} !== 23_000_000n`
    );

    // ASSIGN CONTRIBUTOR
    logger.info(`Assigning contributor with addr ${contributorAddr}`);
    const assignCbor = await assignContributor(
      settingsUtxo,
      { txHash: addRewardTxId, outputIndex: 0 },
      contributorAddr,
      lucid
    );
    const assignTxId = await signSubmitAndWaitConfirmation(
      lucidContributor,
      assignCbor
    );

    const assignOutRef = { txHash: assignTxId, outputIndex: 0 };
    const assignUtxo = await outRefWithErrorCatching(assignOutRef, lucid);
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
      settingsUtxo,
      { txHash: assignTxId, outputIndex: 0 },
      lucid
    );
    const mergeTxId = await signSubmitAndWaitConfirmation(
      lucidGithoney,
      mergeCbor
    );

    const mergeOutRef = { txHash: mergeTxId, outputIndex: 0 };
    const mergeUtxo = await outRefWithErrorCatching(mergeOutRef, lucid);
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
      settingsUtxo,
      { txHash: mergeTxId, outputIndex: 0 },
      lucid
    );
    const claimTxId = await signSubmitAndWaitConfirmation(
      lucidContributor,
      claimCbor
    );

    const claimOutRef = { txHash: claimTxId, outputIndex: 0 };
    const claimUtxo = await outRefWithErrorCatching(claimOutRef, lucid);
    assert(
      claimUtxo.assets["lovelace"] === lovelaceReward + MIN_ADA,
      `Lovelace mismatch ${claimUtxo.assets["lovelace"]} !== ${lovelaceReward}`
    );
    assert(
      claimUtxo.assets[tokenAUnit] === tokenAReward,
      `Token A mismatch ${claimUtxo.assets[tokenAUnit]} !== ${tokenAReward}`
    );
  });

  it("Demo with settings change", async () => {
    const { cbor: deployCbor, outRef: nftOutRef } = await deploySettings(
      githoneyAddr,
      lucid
    );
    logger.info(`Deploying Githoney`);
    const deployTxId = await signSubmitAndWaitConfirmation(
      lucidGithoney,
      deployCbor
    );
    const deployOutRef = { txHash: deployTxId, outputIndex: 0 };
    const settingsUtxo = await outRefWithErrorCatching(deployOutRef, lucid);
    const settingsDatum = await lucid.datumOf(settingsUtxo, SettingsDatum);

    logger.info(`Githoney deployed`);
    let settingsNFTPolicy = "";
    Object.keys(settingsUtxo.assets).forEach((unit) => {
      if (fromUnit(unit).policyId !== "") {
        settingsNFTPolicy = fromUnit(unit).policyId;
      }
    });
    assert(settingsDatum.creation_fee === creationFee);
    assert(settingsDatum.reward_fee === rewardFee);
    assert(
      (await keyPairsToAddress(lucid, settingsDatum.githoney_wallet)) ===
        githoneyAddr
    );
    const mintingScript = githoneyMintingPolicy(settingsNFTPolicy);

    const mintingPolicyid = lucid.utils.mintingPolicyToId(mintingScript);
    const bountyIdTokenUnit = toUnit(mintingPolicyid, fromText(bounty_id));

    // CREATE BOUNTY
    const reward = { [tokenAUnit]: 100n };
    const deadline = BigInt(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime()
    );

    const createCbor = await createBounty(
      settingsUtxo,
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
    const createUtxo = await outRefWithErrorCatching(createOutRef, lucid);
    const createDatum = await lucid.datumOf(createUtxo, GithoneyDatum);

    assert(createDatum.bounty_reward_fee === rewardFee);
    assert(
      githoneyUtxo.assets["lovelace"] === creationFee,
      "Githoney payment wrong"
    );

    const updateSettingsCbor = await updateSettings(settingsUtxo, lucid, {
      githoneyWallet: await addrToWallet(githoneyAddr, lucid),
      creationFee: 10_000_000n,
      rewardFee: 5_000n
    });

    logger.info(`Updating settings`);
    const updateSettingsTxId = await signSubmitAndWaitConfirmation(
      lucidGithoney,
      updateSettingsCbor
    );
    const updateSettingsOutRef = { txHash: updateSettingsTxId, outputIndex: 0 };
    const newSettingsUtxo = await outRefWithErrorCatching(
      updateSettingsOutRef,
      lucid
    );
    const newSettingsDatum = await lucid.datumOf(
      newSettingsUtxo,
      SettingsDatum
    );

    assert(newSettingsDatum.creation_fee === 10_000_000n);
    assert(newSettingsDatum.reward_fee === 5_000n);
    assert(
      (await keyPairsToAddress(lucid, newSettingsDatum.githoney_wallet)) ===
        githoneyAddr
    );

    const newCreateCbor = await createBounty(
      newSettingsUtxo,
      maintainerAddress,
      githoneyAddr,
      { [tokenAUnit]: 100n, lovelace: 15_000_000n },
      deadline,
      "Bounty DEMO 2",
      lucid
    );

    logger.info(`Creating bounty Bounty DEMO 2`);
    const newCreateTxId = await signSubmitAndWaitConfirmation(
      lucidMaintainer,
      newCreateCbor
    );
    const newCreateOutRef = { txHash: newCreateTxId, outputIndex: 0 };
    const newGithoneyOutRef = { txHash: newCreateTxId, outputIndex: 1 };
    const newGithoneyUtxo = await outRefWithErrorCatching(
      newGithoneyOutRef,
      lucid
    );
    const newCreateUtxo = await outRefWithErrorCatching(newCreateOutRef, lucid);

    const newCreateDatum = await lucid.datumOf(newCreateUtxo, GithoneyDatum);

    assert(newCreateDatum.bounty_reward_fee === 5_000n);
    assert(
      newGithoneyUtxo.assets["lovelace"] === 10_000_000n,
      "Githoney payment wrong"
    );

    const assignCbor = await assignContributor(
      newSettingsUtxo,
      newCreateOutRef,
      contributorAddr,
      lucid
    );

    logger.info(`Assigning contributor with addr ${contributorAddr}`);
    const assignTxId = await signSubmitAndWaitConfirmation(
      lucidContributor,
      assignCbor
    );

    const assignOutRef = { txHash: assignTxId, outputIndex: 0 };

    const mergeCbor = await mergeBounty(newSettingsUtxo, assignOutRef, lucid);

    logger.info(`Merging bounty`);
    const mergeTxId = await signSubmitAndWaitConfirmation(
      lucidGithoney,
      mergeCbor
    );
    const mergeOutRef = { txHash: mergeTxId, outputIndex: 0 };
    const githoneyFeePayOutRef = { txHash: mergeTxId, outputIndex: 2 };
    const githoneyFeePayUtxo = await outRefWithErrorCatching(
      githoneyFeePayOutRef,
      lucid
    );
    assert(
      githoneyFeePayUtxo.assets["lovelace"] === 15_000_000n / 2n,
      `Githoney fee pay mismatch ${githoneyFeePayUtxo.assets["lovelace"]}`
    );
    assert(
      githoneyFeePayUtxo.assets[tokenAUnit] === 100n / 2n,
      `Githoney fee pay mismatch ${githoneyFeePayUtxo.assets[tokenAUnit]}`
    );

    const claimCbor = await claimBounty(newSettingsUtxo, mergeOutRef, lucid);

    logger.info(`Claiming bounty`);
    const claimTxId = await signSubmitAndWaitConfirmation(
      lucidContributor,
      claimCbor
    );

    const closeSettingsCbor = await closeSettings(
      nftOutRef,
      newSettingsUtxo,
      lucid
    );

    logger.info(`Closing settings`);
    const closeSettingsTxId = await signSubmitAndWaitConfirmation(
      lucidGithoney,
      closeSettingsCbor
    );
    const githoneyPayOutRef = { txHash: closeSettingsTxId, outputIndex: 0 };
    const githoneyPayUtxo = await outRefWithErrorCatching(
      githoneyPayOutRef,
      lucid
    );
    assert(
      newSettingsUtxo.assets["lovelace"] === githoneyPayUtxo.assets["lovelace"]
    );
  });
});
