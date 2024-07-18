const { getNamedAccounts, ethers, network } = require("hardhat");
const { networkConfig } = require("../helper-hardaht-config");
const { networks } = require("../hardhat.config");

const Amount = ethers.parseEther("1");

async function getWeth() {
    const accounts = await ethers.getSigners();

    const wethContract = await ethers.getContractAt(
        "WETH9",
        networkConfig[network.config.chainId].wETH,
        accounts[0]
    )

    const tx = await wethContract.deposit({ value: Amount });
    await tx.wait(1);
    const bal = await wethContract.balanceOf(accounts[0]);
    console.log(bal);
}

module.exports = { getWeth, Amount };