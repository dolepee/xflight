import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const XLAYER_MAINNET = {
  chainId: 196,
  rpc: process.env.XLAYER_RPC_URL || "https://rpc.xlayer.tech",
  explorer: "https://www.oklink.com/xlayer",
  explorerName: "OKLink",
};

const XLAYER_TESTNET = {
  chainId: 1952,
  rpc: "https://testrpc.xlayer.tech/terigon",
  explorer: "https://www.okx.com/web3/explorer/xlayer-test",
  explorerName: "OKX Testnet Explorer",
  faucet: "https://www.okx.com/xlayer/faucet",
};

const PRIVATE_KEY = process.env.ATTESTER_PRIVATE_KEY || "";

async function tryNetwork(net: typeof XLAYER_MAINNET | typeof XLAYER_TESTNET, label: string) {
  console.log(`\nTrying ${label} (${net.rpc})...`);
  try {
    const provider = new ethers.JsonRpcProvider(net.rpc);
    const chainId = await provider.send("eth_chainId", []);
    const numChainId = typeof chainId === "string" ? parseInt(chainId, 16) : chainId;
    console.log(`  Chain ID: ${numChainId} (expected: ${net.chainId})`);
    return provider;
  } catch (err) {
    console.log(`  Failed: ${(err as Error).message}`);
    return null;
  }
}

async function main() {
  console.log("=== XFlight Deployment Script ===\n");

  let privateKey = PRIVATE_KEY;
  let walletGenerated = false;

  if (!privateKey || privateKey === "0x0000000000000000000000000000000000000000000000000000000000000000") {
    console.log("No private key found â€” generating fresh wallet...");
    const wallet = ethers.Wallet.createRandom();
    privateKey = wallet.privateKey;
    walletGenerated = true;
    console.log("\nWallet Address:", wallet.address);
    console.log("Private Key:", wallet.privateKey);
    console.log("\nâš ï¸  SAVE THE PRIVATE KEY â€” you need it to fund the wallet!");
  }

  const wallet = new ethers.Wallet(privateKey);
  console.log("\nAttester address:", wallet.address);

  let provider = await tryNetwork(XLAYER_MAINNET, "X Layer Mainnet");
  let targetNet = XLAYER_MAINNET;

  if (!provider) {
    console.log("\nâš ï¸  Mainnet RPC unreachable â€” switching to Testnet...");
    provider = await tryNetwork(XLAYER_TESTNET, "X Layer Testnet");
    if (!provider) {
      console.error("No network accessible. Check your internet connection.");
      return;
    }
    targetNet = XLAYER_TESTNET;
    console.log(`\n  Deploying to TESTNET (Chain ID: ${XLAYER_TESTNET.chainId})`);
    console.log(`  âš ï¸  THIS IS TESTNET â€” attestations are not on mainnet!`);
  }

  const connectedWallet = wallet.connect(provider);

  let balance: bigint;
  try {
    const rawBalance = await provider.getBalance(wallet.address);
    balance = rawBalance;
    console.log(`Balance: ${ethers.formatEther(balance)} OKB`);
  } catch (err) {
    console.error("Failed to fetch balance:", (err as Error).message);
    return;
  }

  const MIN_BALANCE = ethers.parseEther("0.002");

  if (balance < MIN_BALANCE) {
    console.log(`\nâš ï¸  INSUFFICIENT BALANCE (${ethers.formatEther(balance)} OKB < ${ethers.formatEther(MIN_BALANCE)} OKB required)`);
    console.log("\nTo fund your wallet:");

    if (targetNet === XLAYER_TESTNET) {
      console.log(`  1. Go to: ${XLAYER_TESTNET.faucet}`);
      console.log(`  2. Enter your wallet address: ${wallet.address}`);
      console.log(`  3. Click "Get" to claim test OKB`);
      console.log(`  4. Then re-run: npm run deploy`);
    } else {
      console.log(`  1. Go to: ${XLAYER_MAINNET.explorer}/address/${wallet.address}`);
      console.log(`  2. Send OKB to this address`);
      console.log(`  3. Then re-run: npm run deploy`);
    }

    console.log("\nNetwork info:");
    console.log(`  Network: ${targetNet === XLAYER_MAINNET ? "X Layer Mainnet" : "X Layer Testnet"}`);
    console.log(`  Chain ID: ${targetNet.chainId}`);
    console.log(`  RPC: ${targetNet.rpc}`);
    console.log(`  Explorer: ${targetNet.explorer}`);
    console.log(`  Wallet: ${wallet.address}`);

    if (walletGenerated) {
      console.log("\nYour new wallet private key:");
      console.log(privateKey);
      console.log("\nAdd this to .env.local:");
      console.log(`ATTESTER_PRIVATE_KEY=${privateKey}`);
    }
    return;
  }

  console.log("\nCompiling XFlightRecorder.sol...");
  const contractSource = fs.readFileSync(
    path.join(__dirname, "../contracts/XFlightRecorder.sol"),
    "utf8"
  );

  let solcModule: { default?: { compile: (input: string) => string }; compile?: (input: string) => string };
  try {
    solcModule = await import("solc");
  } catch {
    console.error("solc not found. Run: npm install solc");
    return;
  }

  const solcCompile = (solcModule.default?.compile ?? solcModule.compile) as (input: string) => string;
  if (!solcCompile) {
    console.error("solc module has no compile function");
    return;
  }

  const input = {
    language: "Solidity",
    sources: { "XFlightRecorder.sol": { content: contractSource } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } },
  };

  const output = JSON.parse(solcCompile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter((e: { severity: string }) => e.severity === "error");
    if (errors.length) {
      console.error("Compilation errors:", errors.map((e: { message: string }) => e.message).join("\n"));
      return;
    }
  }

  const contract = output.contracts["XFlightRecorder.sol"].XFlightRecorder;
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  console.log("ABI and bytecode compiled successfully.");
  console.log(`Deploying to ${targetNet === XLAYER_MAINNET ? "X Layer Mainnet" : "X Layer Testnet"}...`);

  try {
    const factory = new ethers.ContractFactory(abi, "0x" + bytecode, connectedWallet);
    const contractInstance = await factory.deploy(wallet.address);
    console.log("Contract deployed, waiting for confirmation...");

    const deployTx = contractInstance.deploymentTransaction();
    const receipt = deployTx ? await deployTx.wait() : null;
    const contractAddress = await contractInstance.getAddress();

    console.log("\n" + "=".repeat(50));
    console.log("DEPLOYMENT SUCCESSFUL");
    console.log("=".repeat(50));
    console.log(`Network:     ${targetNet === XLAYER_MAINNET ? "X Layer Mainnet" : "X Layer Testnet (âš ï¸)" }`);
    console.log(`Chain ID:   ${targetNet.chainId}`);
    console.log(`Contract:   ${contractAddress}`);
    console.log(`Attester:   ${wallet.address}`);
    console.log(`TX Hash:    ${receipt?.hash || "pending"}`);
    console.log(`Block:      ${receipt?.blockNumber || "pending"}`);
    console.log(`Explorer:   ${targetNet.explorer}/address/${contractAddress}`);

    const envPath = path.join(__dirname, "../.env.local");
    let envContent = "";
    try {
      envContent = fs.readFileSync(envPath, "utf8");
    } catch {}

    const lines = envContent.split("\n").map((line) => {
      if (line.startsWith("XFLIGHT_CONTRACT_ADDRESS=")) {
        return `XFLIGHT_CONTRACT_ADDRESS=${contractAddress}`;
      }
      if (walletGenerated && line.startsWith("ATTESTER_PRIVATE_KEY=")) {
        return `ATTESTER_PRIVATE_KEY=${privateKey}`;
      }
      return line;
    });

    if (walletGenerated && !envContent.includes("ATTESTER_PRIVATE_KEY=")) {
      lines.push(`ATTESTER_PRIVATE_KEY=${privateKey}`);
    }

    fs.writeFileSync(envPath, lines.join("\n"));
    console.log("\n.env.local updated with contract address!");

    console.log("\nYour wallet private key (save this!):");
    console.log(privateKey);

    console.log("\n" + "=".repeat(50));
    console.log("NEXT STEPS:");
    console.log("=".repeat(50));
    console.log("1. npm run dev â€” start the app");
    console.log("2. Go to http://localhost:3000/verify");
    console.log("3. Paste a Moltbook BuildX post URL");
    console.log("4. See the Flight Score and on-chain attestation!");
    console.log("\nExplorer link to share:");
    console.log(`${targetNet.explorer}/tx/${receipt?.hash}`);
  } catch (err) {
    console.error("\nDeployment failed:", (err as Error).message);
    if ((err as Error).message.includes("insufficient funds")) {
      console.error("Not enough OKB to pay for gas.");
    }
  }
}

main().catch(console.error);

