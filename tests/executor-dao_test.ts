
import { Clarinet, Chain, Account } from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { assert, assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { ExecutorDaoErrCode } from "./src/executor-dao-client.ts";
import { Utils } from "./src/utils.ts";

const utils = new Utils();
  
Clarinet.test({
  name: "Ensure nothing works prior to construction",
 fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, contractNftEscrow, phil, exeDaoClient } = utils.setup(chain, accounts);
    const block = chain.mineBlock([
      exeDaoClient.setExtension(phil.address, false, deployer.address),
      exeDaoClient.setExtension(contractNftEscrow, true, deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(ExecutorDaoErrCode.err_unauthorised)
    block.receipts[1].result.expectErr().expectUint(ExecutorDaoErrCode.err_unauthorised)
    exeDaoClient.isExtension(contractNftEscrow).result.expectBool(false)
  }
});

Clarinet.test({
  name: "Ensure can't construct the dao with improper inputs",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, phil, exeDaoClient, contractEDE000, contractEDP001 } = utils.setup(chain, accounts)
    
    let block = chain.mineBlock([
      exeDaoClient.construct(phil.address, deployer.address)
    ]);
    assert(block.receipts.length === 0)
    console.log('Case 1 -> passing random principal does not work')

    block = chain.mineBlock([
      exeDaoClient.construct(contractEDE000, deployer.address)
    ]);
    assert(block.receipts.length === 0)
    console.log('Case 2 -> passing a extension does not work')

    block = chain.mineBlock([
      exeDaoClient.construct(contractEDP001, phil.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(1000)
    console.log('Case 3 -> only executive can construct')

    block = chain.mineBlock([
      exeDaoClient.construct(contractEDP001, deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(1)
    console.log('Case 4 -> cant construct with a valid proposal is the edg-token/edg-token-locked token supplies are 0')
  }
});

Clarinet.test({
  name: "Ensure can construct the dao with the bootstrap proposal and verify initial setup",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { 
      deployer, 
      exeDaoClient, 
      ede000GovernanceTokenClient, 
      contractEDP000, 
      ede003EmergencyProposalsClient, 
      ede004EmergencyExecuteClient 
    } = utils.setup(chain, accounts)
    
    const block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    assertEquals(block.receipts[0].events.filter((o) => o.type === "ft_mint_event").length, 9)
    assert(block.receipts[0].events.filter((o) => o.type === "contract_event").find(((o) => o.contract_event.value === '"ExecutorDAO has risen."')))
    ede000GovernanceTokenClient.edgGetBalance(deployer.address).result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG').result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance('ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC').result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance('ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND').result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance('ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB').result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance('ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0').result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance('ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP').result.expectOk().expectUint(1000)
    ede000GovernanceTokenClient.edgGetBalance('ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ').result.expectOk().expectUint(1000)
    // ward - 
    ede000GovernanceTokenClient.edgGetBalance('STNHKEPYEPJ8ET55ZZ0M5A34J0R3N5FM2CMMMAZ6').result.expectOk().expectUint(0)
    console.log('Case 1 -> emergency team members as expected')
    ede003EmergencyProposalsClient.isEmergencyTeamMember('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM').result.expectBool(true)
    ede003EmergencyProposalsClient.isEmergencyTeamMember('ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5').result.expectBool(true)
    ede003EmergencyProposalsClient.isEmergencyTeamMember('ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC').result.expectBool(false)
    console.log('Case 2 -> executive team members as expected')
    ede004EmergencyExecuteClient.isExecutiveTeamMember('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM').result.expectBool(true)
    ede004EmergencyExecuteClient.isExecutiveTeamMember('ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5').result.expectBool(true)
    ede004EmergencyExecuteClient.isExecutiveTeamMember('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG').result.expectBool(true)
    ede004EmergencyExecuteClient.isExecutiveTeamMember('ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC').result.expectBool(true)
    ede004EmergencyExecuteClient.isExecutiveTeamMember('STNHKEPYEPJ8ET55ZZ0M5A34J0R3N5FM2CMMMAZ6').result.expectBool(false)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    exeDaoClient.isExtension(deployer.address + '.edp000-bootstrap').result.expectBool(false)
    exeDaoClient.isExtension(deployer.address + '.ede000-governance-token').result.expectBool(true)
    exeDaoClient.isExtension(deployer.address + '.ede001-proposal-voting').result.expectBool(true)
    exeDaoClient.isExtension(deployer.address + '.ede002-proposal-submission').result.expectBool(true)
    exeDaoClient.isExtension(deployer.address + '.ede003-emergency-proposals').result.expectBool(true)
    exeDaoClient.isExtension(deployer.address + '.ede004-emergency-execute').result.expectBool(true)
    exeDaoClient.isExtension(deployer.address + '.ede005-dev-fund').result.expectBool(false)
  }
});
