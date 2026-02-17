const { ethers } = require("hardhat");

async function main() {
  const Factory = await ethers.getContractFactory("AsaliTrace");
  const c = await Factory.deploy();
  await c.waitForDeployment();
  console.log("AsaliTrace deployed to:", await c.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});