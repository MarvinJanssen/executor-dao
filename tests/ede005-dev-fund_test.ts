import { Clarinet, Chain, Account } from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { assert } from "https://deno.land/std@0.90.0/testing/asserts.ts";
import { EDE005DevFundClient, EDE005DevFundErrCode } from "./src/ede005-dev-fund-client.ts";
import { Utils } from "./src/utils.ts";

const utils = new Utils();

const attemptClaim = (i: number, amount: number, chain: Chain, block: any, toHeight: number, expect: boolean, ede005DevFundClient: EDE005DevFundClient, address: string): any => {
  chain.mineEmptyBlockUntil(toHeight);

  block = chain.mineBlock([
    ede005DevFundClient.claim('I cannot claim the funds', address),
  ]);
  block.receipts[0].result.expectErr().expectUint(EDE005DevFundErrCode.err_already_claimed)

  block = chain.mineBlock([
    ede005DevFundClient.claim('I can claim the funds', address),
  ]);
  block.receipts[0].result.expectOk().expectBool(expect)
  // let maxClaims = ede005DevFundClient.getMaxClaims().result
  ede005DevFundClient.getDeveloperClaimCount(address).result.expectUint(i)
  assert(block.receipts[0].events[0].ft_transfer_event.amount == amount)
}

Clarinet.test({
  name: "Ensure dev fund is not a valid extension before proposal 005.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      daisy,
      bobby,
      contractEDE005,
      exeDaoClient,
      ede005DevFundClient
    } = utils.setup(chain, accounts);

    exeDaoClient.isExtension(contractEDE005).result.expectBool(false)
    ede005DevFundClient.getDeveloperAllowance(daisy.address).result.expectNone()
    ede005DevFundClient.getDeveloperAllowance(bobby.address).result.expectNone()
  }
});

Clarinet.test({
  name: "Ensure dev fund is a valid extension after proposal 005.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      daisy,
      bobby,
      contractEDE005,
      contractEDP001,
      exeDaoClient,
      ede005DevFundClient
    } = utils.setup(chain, accounts);

    utils.passProposal(0, chain, accounts, contractEDP001)
    exeDaoClient.isExtension(contractEDE005).result.expectBool(true)
    assert(ede005DevFundClient.getDeveloperAllowance(daisy.address).result === '(some {allowance: u100, start-height: u1736})')
    assert(ede005DevFundClient.getDeveloperAllowance(bobby.address).result === '(some {allowance: u20, start-height: u1736})')
    ede005DevFundClient.getDeveloperClaimCount(daisy.address).result.expectUint(0)
    ede005DevFundClient.getDeveloperClaimCount(bobby.address).result.expectUint(0)
  }
});

Clarinet.test({
  name: "Ensure developer cant claim if their address is not registered",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      phil,
      contractEDE005,
      contractEDP001,
      exeDaoClient,
      ede005DevFundClient
    } = utils.setup(chain, accounts);

    let block = utils.passProposal(0, chain, accounts, contractEDP001)
    exeDaoClient.isExtension(contractEDE005).result.expectBool(true)
    ede005DevFundClient.getDeveloperAllowance(phil.address).result.expectNone()
    block = chain.mineBlock([
      ede005DevFundClient.claim('I claim the funds', phil.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE005DevFundErrCode.err_no_allowance)
		chain.mineEmptyBlockUntil(block.height + 4380);
    block = chain.mineBlock([
      ede005DevFundClient.claim('I claim the funds', phil.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE005DevFundErrCode.err_no_allowance)
  }
});

Clarinet.test({
  name: "Ensure contract owner cannot transfer tokens",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer,
      bobby,
      contractEDE005,
      contractEDP001,
      exeDaoClient,
      ede005DevFundClient
    } = utils.setup(chain, accounts);

    let block = utils.passProposal(0, chain, accounts, contractEDP001)
    exeDaoClient.isExtension(contractEDE005).result.expectBool(true)

    assert(ede005DevFundClient.getDeveloperAllowance(bobby.address).result === '(some {allowance: u20, start-height: u1736})')
    block = chain.mineBlock([
      ede005DevFundClient.transfer(10, bobby.address, 'I claim the funds', deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE005DevFundErrCode.err_unauthorised)
  }
});
Clarinet.test({
  name: "Ensure edg owner cannot transfer tokens",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      daisy,
      bobby,
      contractEDE005,
      contractEDP001,
      exeDaoClient,
      ede005DevFundClient
    } = utils.setup(chain, accounts);

    let block = utils.passProposal(0, chain, accounts, contractEDP001)
    exeDaoClient.isExtension(contractEDE005).result.expectBool(true)

    assert(ede005DevFundClient.getDeveloperAllowance(daisy.address).result === '(some {allowance: u100, start-height: u1736})')
    assert(ede005DevFundClient.getDeveloperAllowance(bobby.address).result === '(some {allowance: u20, start-height: u1736})')
    block = chain.mineBlock([
      ede005DevFundClient.transfer(10, bobby.address, 'I claim the funds', daisy.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE005DevFundErrCode.err_unauthorised)
  }
});
Clarinet.test({
  name: "Ensure developer can only claim once per interval",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      bobby,
      contractEDE005,
      contractEDP001,
      exeDaoClient,
      ede005DevFundClient
    } = utils.setup(chain, accounts);

    const block = utils.passProposal(0, chain, accounts, contractEDP001)
    exeDaoClient.isExtension(contractEDE005).result.expectBool(true)

    let oneMonth = 4380
    let bh = block.height
    let newHeight = 0

    for (let i=1; i < 21; i++) {
      newHeight = bh + ((oneMonth - 2) * i) + (i - 1) * 2
      attemptClaim(i, 20, chain, block, newHeight, true, ede005DevFundClient, bobby.address)
    }
    attemptClaim(21, 20, chain, block, (bh + ((oneMonth - 2) * 21) + (21 - 1) * 2), true, ede005DevFundClient, bobby.address)
  }
});
Clarinet.test({
  name: "Ensure developer cant claim with 0 allowance",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      bobby,
      contractEDP001,
      contractEDP001_1,
      ede005DevFundClient
    } = utils.setup(chain, accounts);

    let block = utils.passProposal(0, chain, accounts, contractEDP001)

    assert(ede005DevFundClient.getDeveloperAllowance(bobby.address).result === '(some {allowance: u20, start-height: u1736})')

    chain.mineEmptyBlock(1250);

    block = utils.passProposal(block.height, chain, accounts, contractEDP001_1)

    assert(ede005DevFundClient.getDeveloperAllowance(bobby.address).result === '(some {allowance: u0, start-height: u4719})')
    block = chain.mineBlock([
      ede005DevFundClient.claim('I claim the funds', bobby.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE005DevFundErrCode.err_already_claimed)
  }
});
Clarinet.test({
  name: "Ensure developer can be removed from dev fund",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      bobby,
      contractEDP001,
      contractEDP001_1,
      ede005DevFundClient
    } = utils.setup(chain, accounts);

    let block = utils.passProposal(0, chain, accounts, contractEDP001)

    assert(ede005DevFundClient.getDeveloperAllowance(bobby.address).result === '(some {allowance: u20, start-height: u1736})')

    chain.mineEmptyBlock(1250);

    block = utils.passProposal(block.height, chain, accounts, contractEDP001_1)

    assert(ede005DevFundClient.getDeveloperAllowance(bobby.address).result === '(some {allowance: u0, start-height: u4719})')
  }
});
Clarinet.test({
  name: "Ensure developer can be added to dev fund",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      hunter,
      contractEDP001,
      contractEDP001_1,
      ede005DevFundClient
    } = utils.setup(chain, accounts);

    let block = utils.passProposal(0, chain, accounts, contractEDP001)

    ede005DevFundClient.getDeveloperAllowance(hunter.address).result.expectNone()

    chain.mineEmptyBlock(1250);

    block = utils.passProposal(block.height, chain, accounts, contractEDP001_1)

    assert(ede005DevFundClient.getDeveloperAllowance(hunter.address).result === '(some {allowance: u200, start-height: u4719})')
  }
});

Clarinet.test({
  name: "Ensure the dao can transfer edg tokens thorugh the dev fund transfer via a proposal",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      ward,
      contractEDP001,
      contractEDP001_1,
      ede005DevFundClient,
      ede000GovernanceTokenClient
    } = utils.setup(chain, accounts);

    const block = utils.passProposal(0, chain, accounts, contractEDP001)

    ede005DevFundClient.getDeveloperAllowance(ward.address).result.expectNone()

    chain.mineEmptyBlock(1250);

    utils.passProposal(block.height, chain, accounts, contractEDP001_1)

    assert(ede005DevFundClient.getDeveloperAllowance(ward.address).result === '(some {allowance: u1, start-height: u4719})')
    ede000GovernanceTokenClient.edgGetBalance(ward.address).result.expectOk().expectUint(500)
  }
});