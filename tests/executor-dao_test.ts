
import { Clarinet, Chain, Account } from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { assert, assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { ExecutorDaoClient, ExecutorDaoErrCode } from "./src/executor-dao-client.ts";
import { EDP000BootstrapClient, EDP000BootstrapErrCode } from "./src/edp000-bootstrap-client.ts";
import { EDE000GovernanceTokenClient, EDE000GovernanceTokenErrCode } from "./src/ede000-governance-token-client.ts";
import { EDE003EmergencyProposalsClient, EDE003EmergencyProposalsErrCode } from "./src/ede003-emergency-proposals-client.ts";
import { EDE004EmergencyExecuteClient, EDE004EmergencyExecuteErrCode } from "./src/ede004-emergency-execute-client.ts";

const setup = (chain: Chain, accounts: Map<string, Account>): {
    administrator: Account;
    deployer: Account;
    contractEXD: string;
    contractNE: string;
    contractEDP000: string;
    contractEDP001: string;
    contractEDP002: string;
    contractEDP003: string;
    contractEDE000: string;
    contractEDE001: string;
    contractEDE002: string;
    contractEDE003: string;
    contractEDE004: string;
    contractEDE005: string;
    phil: Account;
    daisy: Account;
    bobby: Account;
    hunter: Account;
    exeDaoClient: ExecutorDaoClient;
    edp000BootstrapClient: EDP000BootstrapClient;
    ede000GovernanceTokenClient: EDE000GovernanceTokenClient;
    ede003EmergencyProposalsClient: EDE003EmergencyProposalsClient;
    ede004EmergencyExecuteClient: EDE004EmergencyExecuteClient;
  } => {
    const administrator = accounts.get("deployer")!;
    const deployer = accounts.get("deployer")!;
    const contractEXD = accounts.get("deployer")!.address + '.executor-dao';
    const contractNE = accounts.get("deployer")!.address + '.nft-escrow';
    const contractEDP000 = accounts.get("deployer")!.address + '.edp000-bootstrap';
    const contractEDP001 = accounts.get("deployer")!.address + '.edp001-dev-fund';
    const contractEDP002 = accounts.get("deployer")!.address + '.edp002-kill-emergency-execute';
    const contractEDP003 = accounts.get("deployer")!.address + '.edp003-whitelist-escrow-nft';
    const contractEDE000 = accounts.get("deployer")!.address + '.ede000-governance-token';
    const contractEDE001 = accounts.get("deployer")!.address + '.ede001-proposal-voting';
    const contractEDE002 = accounts.get("deployer")!.address + '.ede002-proposal-submission';
    const contractEDE003 = accounts.get("deployer")!.address + '.ede003-emergency-proposals';
    const contractEDE004 = accounts.get("deployer")!.address + '.ede004-emergency-execute';
    const contractEDE005 = accounts.get("deployer")!.address + '.ede005-dev-fund';
    const phil = accounts.get("wallet_1")!;
    const daisy = accounts.get("wallet_2")!;
    const bobby = accounts.get("wallet_3")!;
    const hunter = accounts.get("wallet_4")!;
    const exeDaoClient = new ExecutorDaoClient(chain, deployer, 'executor-dao');
    const edp000BootstrapClient = new EDP000BootstrapClient(chain, deployer, 'edp000-bootstrap');
    const ede000GovernanceTokenClient = new EDE000GovernanceTokenClient(chain, deployer, 'ede000-governance-token');
    const ede003EmergencyProposalsClient = new EDE003EmergencyProposalsClient(chain, deployer, 'ede003-emergency-proposals');
    const ede004EmergencyExecuteClient = new EDE004EmergencyExecuteClient(chain, deployer, 'ede004-emergency-execute');
    return { 
        administrator, deployer, contractEXD, contractNE,
        contractEDP000, contractEDP001, contractEDP002, contractEDP003,
        contractEDE000, contractEDE001, contractEDE002, contractEDE003, contractEDE004, contractEDE005, 
        phil, daisy, bobby, hunter, exeDaoClient, edp000BootstrapClient, ede000GovernanceTokenClient,
        ede003EmergencyProposalsClient, ede004EmergencyExecuteClient };
  };
  
Clarinet.test({
  name: "Ensure nothing works prior to construction",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, contractNE, phil, exeDaoClient } = setup(chain, accounts);
    let block = chain.mineBlock([
      exeDaoClient.setExtension(phil.address, false, deployer.address),
      exeDaoClient.setExtension(contractNE, true, deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(ExecutorDaoErrCode.err_unauthorised)
    block.receipts[1].result.expectErr().expectUint(ExecutorDaoErrCode.err_unauthorised)
    exeDaoClient.isExtension(contractNE).result.expectBool(false)
  }
});

Clarinet.test({
  name: "Ensure can't construct the dao with improper inputs",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, phil, exeDaoClient, ede000GovernanceTokenClient, contractEDP000, contractEDE000, contractEDP001 } = setup(chain, accounts)
    
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
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { 
      deployer, 
      exeDaoClient, 
      ede000GovernanceTokenClient, 
      contractEDP000, 
      ede003EmergencyProposalsClient, 
      ede004EmergencyExecuteClient 
    } = setup(chain, accounts)
    
    let block = chain.mineBlock([
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
