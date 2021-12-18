import Ganache from 'ganache'
import Web3 from 'web3'
import { Factory as FactoryContext } from '../dist/@types/Factory'
import { Campaign as CampaignContext } from '../dist/@types/Campaign'

const web3 = new Web3(Ganache.provider() as any)
const FactoryArtifact = require('../dist/Factory.json')
const CampaignArtifact = require('../dist/Campaign.json')

let accounts: string[]
let factory: FactoryContext
let campaign: CampaignContext

beforeEach(async () => {
  accounts = await web3.eth.getAccounts()

  factory = (await new web3.eth.Contract(FactoryArtifact.abi)
    .deploy({ data: FactoryArtifact.evm.bytecode.object })
    .send({ from: accounts[0], gas: 3_000_000 })) as unknown as FactoryContext

  await factory.methods.createCampaign('100').send({
    from: accounts[0],
    gas: 5_000_000,
  })

  const [campaignAddress] = await factory.methods.getDeployedCampaigns().call()

  campaign = new web3.eth.Contract(
    CampaignArtifact.abi,
    campaignAddress
  ) as unknown as CampaignContext
})

describe('Campaign + Factory', () => {
  it('deploys a factory and a campaign', () => {
    expect(factory.options.address).toBeTruthy()
    expect(campaign.options.address).toBeTruthy()
  })

  it('marks factory caller as the campaign manager', async () => {
    const manager = await campaign.methods.manager().call()
    expect(manager).toEqual(accounts[0])
  })

  it('allows people to contribute and marks them as approvers', async () => {
    await campaign.methods.contribute().send({
      from: accounts[1],
      value: 100,
    })
    const isContributor = await campaign.methods.approvers(accounts[1]).call()
    expect(isContributor).toBeTruthy()
  })

  it('requires a minimum contribution', async () => {
    expect.assertions(1)
    try {
      await campaign.methods.contribute().send({
        from: accounts[1],
        value: 50,
      })
    } catch (err) {
      expect(err).toBeDefined()
    }
  })

  it('allows a manager to create a payment request', async () => {
    await campaign.methods
      .createRequest(
        'Need money for this test',
        web3.utils.toWei('0.1', 'ether'),
        accounts[1]
      )
      .send({
        from: accounts[0],
        gas: 3_000_000,
      })

    const request = await campaign.methods.requests(0).call()
    expect(request.description).toBe('Need money for this test')
  })

  it('processes requests', async () => {
    await campaign.methods.contribute().send({
      from: accounts[0],
      value: web3.utils.toWei('10', 'ether'),
    })

    await campaign.methods
      .createRequest(
        'Descriptive message',
        web3.utils.toWei('5', 'ether'),
        accounts[1]
      )
      .send({
        from: accounts[0],
        gas: 3_000_000,
      })

    await campaign.methods.approveRequest(0).send({
      from: accounts[0],
      gas: 3_000_000,
    })

    await campaign.methods.finalizeRequest(0).send({
      from: accounts[0],
      gas: 3_000_000,
    })

    const balance = parseFloat(
      web3.utils.fromWei(await web3.eth.getBalance(accounts[1]), 'ether')
    )

    expect(balance).toBeGreaterThan(1000)
  })
})
