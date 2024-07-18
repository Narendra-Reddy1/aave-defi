const { ethers, network, getNamedAccounts } = require("hardhat");
const { networkConfig } = require("../helper-hardaht-config");
const { getWeth, Amount } = require("./getWeth");


/* 
we got wrapped eth
we got lendingPoolAddressProvider
we got lendingPool.
To deposit in to the Aave protocol need to give approval from Weth contract to LendingPool Contract.
Then you can deposit amount
-------------------------------
Borrowing.....
??
 */
async function main() {
    await getWeth();
    const { deployer } = await getNamedAccounts();
    const accounts = await ethers.getSigners();
    const lendingPoolAddressProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        networkConfig[network.config.chainId].lendingPoolAddressProvider,
        accounts[0]
    );
    //console.log(lendingPoolAddressProvider);
    const lendingPool = await getLendingPool(lendingPoolAddressProvider, accounts[0]);
    console.log(lendingPool.target)
    console.log(`Approving....`);
    await approveToken(networkConfig[network.config.chainId].wETH, lendingPool.target, ethers.parseEther("1000"), accounts[0]);
    console.log(`Approved ${ethers.parseEther("1000")} ETH`);
    console.log(`Depositing....`);
    await lendingPool.deposit(
        networkConfig[network.config.chainId].wETH,
        ethers.parseEther("0.05"),
        accounts[0].address,
        0
    );
    console.log(`Depositing success with amount ${ethers.parseEther("0.05")}....`);
    const { availableBorrowsETH } = await getUserAccountData(lendingPool, accounts[0]);
    const price = await getDaiPrice(accounts[0]);
    console.log("Total Dai token pegged: ", (getTotalPeggedDai(availableBorrowsETH, price)));
    const borrwableDai = getTotalBorrowableDai(availableBorrowsETH, price);
    console.log("Total borrowable DAI ", borrwableDai);
    const borrowableDaiToWei = ethers.parseEther(borrwableDai.toString());

    //BORROWING>>>>
    console.log("Borrowing....");
    await lendingPool.borrow(networkConfig[network.config.chainId].daiToken, borrowableDaiToWei, 2/*=Stable Rate */, 0, accounts[0]);
    console.log("Borrowed ", borrwableDai);
    const { totalDebtETH } = await getUserAccountData(lendingPool, accounts[0]);
    await approveToken(networkConfig[network.config.chainId].daiToken, lendingPool.target, ethers.parseEther("100"), accounts[0]);

    console.log("Repaaying....");
    await lendingPool.repay(networkConfig[network.config.chainId].daiToken, totalDebtETH, 2, accounts[0]);
    console.log("Debt repayed....");
    await getUserAccountData(lendingPool, accounts[0]);
}

function getTotalBorrowableDai(availableBorrowsETH, daiPrice) {
    return (getTotalPeggedDai(availableBorrowsETH, daiPrice) * 80n) / 100n;
}
function getTotalPeggedDai(availableBorrowsETH, daiPrice) {
    return availableBorrowsETH * 1n / daiPrice;
}

async function getUserAccountData(lendingPool, account) {
    const { totalCollateralETH,
        totalDebtETH,
        availableBorrowsETH,
        currentLiquidationThreshold,
        ltv,
        healthFactor
    } = await lendingPool.getUserAccountData(account);
    console.log(`Total Debt ${totalDebtETH} ETH....`);
    console.log(`Available to borrow ${availableBorrowsETH} ETH....`);
    return { totalDebtETH, availableBorrowsETH };

}

async function getDaiPrice(account) {
    const daiPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        networkConfig[network.config.chainId].priceFeed,
        account
    );
    const price = (await daiPriceFeed.latestRoundData())[1];
    console.log(price);
    return price;
}

async function getLendingPool(lpAddressProvider, account) {
    const lendingPoolAddress = await lpAddressProvider.getLendingPool();
    const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account);
    return lendingPool;
}

async function approveToken(address, spender, amount, account) {
    const erc20 = await ethers.getContractAt("IERC20", address, account);
    await erc20.approve(spender, amount);
    const allowance = await erc20.allowance(account, spender);
    console.log("Allowance added:: ", allowance);
}


main().catch(err => {
    console.log(err);
})