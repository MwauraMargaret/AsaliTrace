import { ethers } from "ethers";
import AsaliTrace from "../artifacts/contracts/AsaliTrace.sol/AsaliTrace.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_ASALITRACE_ADDRESS;

export async function getContract() {
  if (!window.ethereum) throw new Error("MetaMask not found");
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, AsaliTrace.abi, signer);
}