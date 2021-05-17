import { l2ethers as ethers } from 'hardhat'
import { Contract, Signer } from 'ethers'
import { expect } from './setup'

describe("Rubicon Protocol L2 Migrations", () => {
    let account1: Signer
    let account2: Signer
    let account3: Signer
    before(async () => {
        ;[account1, account2, account3] = await ethers.getSigners()
    })

    it("deploy  Rubicon Market", async () => {
        let RubiconMarket: Contract
        beforeEach(async () => {
          RubiconMarket = await (await ethers.getContractFactory('RubiconMarket'))
              .connect(account1)
            .deploy()
        })   
        // expect('1').to.equal('1')   
        // Now we're cooking with gas!
    })
})