
import { Token, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core';
import { ethers, BigNumber } from 'ethers';
import { AlphaRouter } from '@uniswap/smart-order-router';
import JSBI from 'jsbi';
import ERC20ABI from './abi.json';

const V3_SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';
const REACT_APP_INFURA_URL_TESTNET = process.env.REACT_APP_INFURA_URL_TESTNET;

const chainId = 3;

const web3Provider = new ethers.providers.JsonRpcProvider(REACT_APP_INFURA_URL_TESTNET);
const router = new AlphaRouter({ chainId: chainId, provider: web3Provider });

const name0 = 'USDC';
const symbol0 = 'USDC';
const decimals0 = 18;
const address0 = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d';

const name1 = 'Singapore Stable Dollor Valley';
const symbol1 = 'SGDV';
const decimals1 = 18;
const address1 = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984';

export const USDC = new Token(chainId, address0, decimals0, symbol0, name0);
export const SGDV = new Token(chainId, address1, decimals1, symbol1, name1);

export const getUsdcContract = () => new ethers.Contract(address0, ERC20ABI, web3Provider);
export const getSgdvContract = () => new ethers.Contract(address1, ERC20ABI, web3Provider);

export const getPrice = async (inputAmount, slippageAmount, deadline, walletAddress) => {
  const percentSlippage = new Percent(slippageAmount, 100)
  const wei = ethers.utils.parseUnits(inputAmount.toString(), decimals0)
  const currencyAmount = CurrencyAmount.fromRawAmount(USDC, JSBI.BigInt(wei))

  const route = await router.route(
    currencyAmount,
    SGDV,
    TradeType.EXACT_INPUT,
    {
      recipient: walletAddress,
      slippageTolerance: percentSlippage,
      deadline: deadline,
    }
  )

  const transaction = {
    data: route.methodParameters.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: BigNumber.from(route.methodParameters.value),
    from: walletAddress,
    gasPrice: BigNumber.from(route.gasPriceWei),
    gasLimit: ethers.utils.hexlify(1000000)
  }

  const quoteAmountOut = route.quote.toFixed(6)
  const ratio = (inputAmount / quoteAmountOut).toFixed(3)

  return [
    transaction,
    quoteAmountOut,
    ratio
  ]
}

export const runSwap = async (transaction, signer) => {
  const approvalAmount = ethers.utils.parseUnits('10', 18).toString()
  const contract0 = getUsdcContract()
  await contract0.connect(signer).approve(
    V3_SWAP_ROUTER_ADDRESS,
    approvalAmount
  )

  signer.sendTransaction(transaction)
}
