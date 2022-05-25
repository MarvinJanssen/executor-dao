
import { Clarinet, Chain, Account } from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { EDE003EmergencyProposalsErrCode } from "./src/ede003-emergency-proposals-client.ts";
import { Utils } from "./src/utils.ts";

const utils = new Utils();

Clarinet.test({
    name: "Ensure emergency proposals parameters cant be changed without an emergancy proposal.",
    fn(chain: Chain, accounts: Map<string, Account>) {
      const {
        deployer, 
        exeDaoClient,
        bobby,
        contractEDP000,
        ede003EmergencyProposalsClient
      } = utils.setup(chain, accounts)
  
      let block = chain.mineBlock([
        exeDaoClient.construct(contractEDP000, deployer.address),
        ede003EmergencyProposalsClient.setEmergencyTeaMmember(bobby.address, true, deployer.address),
        ede003EmergencyProposalsClient.setEmergencyTeamSunsetHeight(90, deployer.address),
        ede003EmergencyProposalsClient.setEmergencyProposalDuration(100, deployer.address)
      ]);
      block.receipts[0].result.expectOk().expectBool(true)
      block.receipts[1].result.expectErr().expectUint(EDE003EmergencyProposalsErrCode.err_unauthorised)
      block.receipts[2].result.expectErr().expectUint(EDE003EmergencyProposalsErrCode.err_unauthorised)
      block.receipts[3].result.expectErr().expectUint(EDE003EmergencyProposalsErrCode.err_unauthorised)
    }
});

Clarinet.test({
  name: "Ensure emergency proposal can only be proposed by an emergency team member ",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { 
      deployer, 
      exeDaoClient,
      bobby,
      contractEDP000,
      contractEDP002,
      ede003EmergencyProposalsClient,
      ede001ProposalVotingClient,      
    } = utils.setup(chain, accounts)
    
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    ede001ProposalVotingClient.getProposalData(contractEDP002).result.expectNone()
    ede003EmergencyProposalsClient.isEmergencyTeamMember(bobby.address).result.expectBool(false)
    block = chain.mineBlock([
      ede003EmergencyProposalsClient.emergencyPropose(contractEDP002, bobby.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE003EmergencyProposalsErrCode.err_not_emergency_team_member)

  }
});

Clarinet.test({
  name: "Ensure emergency proposal can only be proposed before sunset",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { 
      deployer,
      exeDaoClient,
      phil,
      contractEDP000,
      contractEDP002,
      ede003EmergencyProposalsClient,
      ede001ProposalVotingClient,      
    } = utils.setup(chain, accounts)
    
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    
    chain.mineEmptyBlock(13140);

    ede001ProposalVotingClient.getProposalData(contractEDP002).result.expectNone()
    ede003EmergencyProposalsClient.isEmergencyTeamMember(phil.address).result.expectBool(true)
    block = chain.mineBlock([
      ede003EmergencyProposalsClient.emergencyPropose(contractEDP002, phil.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE003EmergencyProposalsErrCode.err_sunset_height_reached)
  }
});

Clarinet.test({
  name: "Ensure emergency proposal can be proposed",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const { 
      deployer,
      exeDaoClient,
      phil,
      contractEDP000,
      contractEDP002,
      ede003EmergencyProposalsClient,
      ede001ProposalVotingClient,      
    } = utils.setup(chain, accounts)
    
    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
    
    // chain.mineEmptyBlock(13140);

    ede001ProposalVotingClient.getProposalData(contractEDP002).result.expectNone()
    ede003EmergencyProposalsClient.isEmergencyTeamMember(phil.address).result.expectBool(true)
    block = chain.mineBlock([
      ede003EmergencyProposalsClient.emergencyPropose(contractEDP002, phil.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
  }
});
