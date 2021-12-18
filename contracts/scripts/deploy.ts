import WalletProvider from '@truffle/hdwallet-provider'
import Web3 from 'web3'
import { config } from 'dotenv'

config()

const FactoryArtifact = require('../dist/Factory.json')

const provider = new WalletProvider(
  process.env.WALLET_MNEMONIC!,
  process.env.WALLET_ENDPOINT!
)

const web3 = new Web3(provider)

// No top level await??? Troubles making it work.
;(async () => {
  const accounts = await web3.eth.getAccounts()

  const result = await new web3.eth.Contract(FactoryArtifact.abi)
    .deploy({ data: FactoryArtifact.evm.bytecode.object })
    .send({ from: accounts[0], gas: 3_000_000 })

  console.log(`Deployed at address: ${result.options.address}`)
  provider.engine.stop()
})()
