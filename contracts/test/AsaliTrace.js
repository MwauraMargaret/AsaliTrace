const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AsaliTrace", function () {
  it("creates and reads a batch", async function () {
    const Factory = await ethers.getContractFactory("AsaliTrace");
    const c = await Factory.deploy();
    await c.waitForDeployment();

    const [signer] = await ethers.getSigners();
    await c.createBatch("B1", "Acacia Honey");

    const b = await c.getBatch("B1");
    expect(b.batchId).to.equal("B1");
    expect(b.description).to.equal("Acacia Honey");
    expect(b.createdBy).to.equal(await signer.getAddress());
  });
});