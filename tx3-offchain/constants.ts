import dotenv from "dotenv";

dotenv.config();

const settingsTokenName = "settingsNFT";
const creationFee = BigInt(process.env.CREATION_FEE!);
const rewardFee = BigInt(process.env.REWARD_FEE!);
const githoneyAddr = process.env.GITHONEY_ADDRESS!;

export { creationFee, rewardFee, githoneyAddr, settingsTokenName };
