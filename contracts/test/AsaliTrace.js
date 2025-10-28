import pkg from "hardhat";
const { ethers } = pkg;
import { expect } from "chai";

describe("AsaliTrace", function () {
  it("should create a batch", async function () {
    const AsaliTrace = await ethers.getContractFactory("AsaliTrace");
    const contract = await AsaliTrace.deploy();
    await contract.waitForDeployment();

    await contract.createBatch("BATCH001", "Honey harvested");
    const batch = await contract.getBatch("BATCH001");

    expect(batch.description).to.equal("Honey harvested");
  });

  it("should add a lab test", async function () {
    const AsaliTrace = await ethers.getContractFactory("AsaliTrace");
    const contract = await AsaliTrace.deploy();
    await contract.waitForDeployment();

    await contract.createBatch("BATCH001", "Honey harvested");
    await contract.addLabTest("TEST001", "BATCH001", "Pure");

    const test = await contract.getLabTest("TEST001");
    expect(test.result).to.equal("Pure");
  });

  it("should issue a certificate", async function () {
    const AsaliTrace = await ethers.getContractFactory("AsaliTrace");
    const contract = await AsaliTrace.deploy();
    await contract.waitForDeployment();

    await contract.createBatch("BATCH001", "Honey harvested");
    await contract.issueCertificate("CERT001", "BATCH001", "KEBS");

    const cert = await contract.getCertificate("CERT001");
    expect(cert.issuer).to.equal("KEBS");
  });
});