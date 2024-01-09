import './App.css';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

import PageButton from './components/PageButton';
import ConnectButton from './components/ConnectButton';
import CurrencyField from './components/CurrencyField';

import BeatLoader from "react-spinners/BeatLoader";
import { getUsdcContract, getSgdvContract, getPrice, runSwap } from './AlphaRouterService'
import { USDC, SGDV } from './AlphaRouterService';

const provider = new ethers.providers.JsonRpcProvider('your_provider_url');
export default App

function App() {
  const [provider, setProvider] = useState(undefined)
  const [signer, setSigner] = useState(undefined)
  const [signerAddress, setSignerAddress] = useState(undefined)

  const [inputAmount, setInputAmount] = useState(undefined)
  const [outputAmount, setOutputAmount] = useState(undefined)
  const [transaction, setTransaction] = useState(undefined)
  const [loading, setLoading] = useState(undefined)
  const [ratio, setRatio] = useState(undefined)
  const [usdcContract, setUsdcContract] = useState(undefined)
  const [sgdvContract, setSgdvContract] = useState(undefined)

  const [usdcAmount, setUsdcAmount] = useState(undefined)
  const [sgdvAmount, setSgdvAmount] = useState(undefined)
  

  useEffect(() => {
    const onLoad = async () => {
      const provider = await new ethers.providers.Web3Provider(window.ethereum)
      setProvider(provider)

      const usdcContract = getUsdcContract()
      setUsdcContract(usdcContract)

      const sgdvContract = getSgdvContract()
      setSgdvContract(sgdvContract)
    }
    onLoad()
  }, [])

  const getSigner = async provider => {
    provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    setSigner(signer)
  }
  const isConnected = () => signer !== undefined
  const getWalletAddress = () => {
    signer.getAddress()
      .then(address => {
        setSignerAddress(address)

        // todo: connect usdc and sgdv contracts
        usdcContract.balanceOf(address)
          .then(res => {
            setUsdcAmount( Number(ethers.utils.formatEther(res)) )
          })
        sgdvContract.balanceOf(address)
          .then(res => {
            setSgdvAmount( Number(ethers.utils.formatEther(res)) )
          })

      })
  }

  if (signer !== undefined) {
    getWalletAddress()
  }

  const getSwapPrice = (inputAmount) => {
    setLoading(true)
    setInputAmount(inputAmount)

    const swap = getPrice(
      inputAmount,
      Math.floor(Date.now() / 1000),

      signerAddress,
      USDC,  // 입력 토큰 (USDC)
      SGDV   // 출력 토큰 (SGDV)
    ).then((data) => {
      setTransaction(data[0])
      setOutputAmount(data[1])
      setRatio(data[2])
      setLoading(false)
    })
    
  }

  return (
    <div className="App">
      <div className="appNav">
      <img src="/sgdvlogo.png" alt="logo" className="centeredImage"/>
      <div className="appnavFoot">
        <div className="my-2 buttonContainer buttonContainerBottom">
          <PageButton name={"Swap"} isBold={true} />
          <PageButton name={"Pay"} />
          <PageButton name={"Map"} />
          <PageButton name={"About"} />
        </div>
        </div>
        <div className="rightNav">
          <div className="connectButtonContainer">
            <ConnectButton
              provider={provider}
              isConnected={isConnected}
              signerAddress={signerAddress}
              getSigner={getSigner}
            />
          </div>
          <div className="my-2 buttonContainer">
            <PageButton name={"..."} isBold={true} />
          </div>
        </div>
      </div>

      <div className="appBody">
        <div className="swapContainer">
          <div className="swapHeader">
            <span className="swapText">Swap</span>
            <span className="exRatio" >
            </span>
   
          </div>

          <div className="swapBody">
          <CurrencyField
          field="input"
          tokenName="USDC"
          getSwapPrice={getSwapPrice}
          signer={signer}
          balance={usdcAmount}
/>
<CurrencyField
          field="output"
          tokenName="SGDV"
          value={outputAmount}
  signer={signer}
  balance={sgdvAmount}
  spinner={BeatLoader}
  loading={loading}
/>
          </div>
          <div className="ratioContainer">
            {ratio && (
              <>
                {`1 SGDV = ${ratio} USDC`}
              </>
            )}
          </div>
          1 USDC = 1.3 SGDV
          <div className="swapButtonContainer">
            {isConnected() ? (
              <div
                onClick={() => runSwap(transaction, signer)}
                className="swapButton"
              >
                Swap
              </div>
            ) : (
              <div
                onClick={() => getSigner(provider)}
                className="swapButton"
              >
                Connect Wallet
              </div>
            )}
          </div>

        </div>
      </div>
    

    </div>
    
  );
}

