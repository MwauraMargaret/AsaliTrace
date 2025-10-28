import "@nomicfoundation/hardhat-toolbox";
import path from "path";
import { fileURLToPath } from "url";

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  solidity: "0.8.19",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
  paths: {
    // Send compiled ABIs to React app
    artifacts: path.join(__dirname, "../frontend/src/contracts"),
  },
};