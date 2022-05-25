
import { Clarinet, Chain, Account } from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { ExecutorDaoErrCode } from "./src/executor-dao-client.ts";
import { EDE004EmergencyExecuteErrCode } from "./src/ede004-emergency-execute-client.ts";
import { Utils } from "./src/utils.ts";

const utils = new Utils();

Clarinet.test({
  name: "Ensure extension parameters cannot be changed without authority.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      bobby,
      contractEDP000,
      ede004EmergencyExecuteClient
    } = utils.setup(chain, accounts)

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    ede004EmergencyExecuteClient.isExecutiveTeamMember(bobby.address).result.expectBool(true)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.setExecutiveTeamMember(bobby.address, false, deployer.address),
      ede004EmergencyExecuteClient.setExecutiveTeamSunsetHeight(90, deployer.address),
      ede004EmergencyExecuteClient.setSignalsRequired(100, deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE004EmergencyExecuteErrCode.err_unauthorised)
    block.receipts[1].result.expectErr().expectUint(EDE004EmergencyExecuteErrCode.err_unauthorised)
    block.receipts[2].result.expectErr().expectUint(EDE004EmergencyExecuteErrCode.err_unauthorised)

    ede004EmergencyExecuteClient.isExecutiveTeamMember(bobby.address).result.expectBool(true)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
  }
});

Clarinet.test({
  name: "Ensure only executive team members can take an executive action.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      ward,
      contractEDP000, 
      contractEDP007,
      ede004EmergencyExecuteClient
    } = utils.setup(chain, accounts)

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, ward.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(EDE004EmergencyExecuteErrCode.err_not_executive_team_member)
  }
});

Clarinet.test({
  name: "Ensure executive team members cant signal multiple times on same proposal.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil,
      contractEDP000, 
      contractEDP007,
      ede004EmergencyExecuteClient
    } = utils.setup(chain, accounts)

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, phil.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, phil.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)
  }
});

Clarinet.test({
  name: "Ensure settings on the emergency execute extension can be changed via a proposal.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, daisy, bobby,
      contractEDP000, 
      contractEDP007,
      ede004EmergencyExecuteClient
    } = utils.setup(chain, accounts)

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, phil.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, daisy.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(2)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, bobby.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(3)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(4)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(false)
  }
});

Clarinet.test({
  name: "Ensure same proposal cat be executed twice.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, daisy, bobby, ward,
      contractEDP000, 
      contractEDP007,
      ede004EmergencyExecuteClient
    } = utils.setup(chain, accounts)

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, phil.address),
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, daisy.address),
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, bobby.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    block.receipts[1].result.expectOk().expectUint(2)
    block.receipts[2].result.expectOk().expectUint(3)
    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(4)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(false)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(ward.address).result.expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, ward.address),
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, daisy.address),
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, bobby.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(ExecutorDaoErrCode.err_already_executed)
  }
});

Clarinet.test({
  name: "Ensure an extension can be switched off via an emergency execute.",
  fn(chain: Chain, accounts: Map<string, Account>) {
    const {
      deployer, 
      exeDaoClient,
      phil, daisy, bobby, ward,
      contractEDP000, 
      contractEDP002,
      contractEDP007,
      contractEDE000,
      contractEDE001,
      contractEDE002,
      contractEDE004,
      ede004EmergencyExecuteClient
    } = utils.setup(chain, accounts)

    let block = chain.mineBlock([
      exeDaoClient.construct(contractEDP000, deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true)

    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)
    exeDaoClient.isExtension(contractEDE000).result.expectBool(true)
    exeDaoClient.isExtension(contractEDE001).result.expectBool(true)
    exeDaoClient.isExtension(contractEDE002).result.expectBool(true)
    exeDaoClient.isExtension(contractEDE004).result.expectBool(true)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP002, phil.address),
      ede004EmergencyExecuteClient.executiveAction(contractEDP002, daisy.address),
      ede004EmergencyExecuteClient.executiveAction(contractEDP002, bobby.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    block.receipts[1].result.expectOk().expectUint(2)
    block.receipts[2].result.expectOk().expectUint(3)
    exeDaoClient.isExtension(contractEDE004).result.expectBool(false)

    block = chain.mineBlock([
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, phil.address),
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, daisy.address),
      ede004EmergencyExecuteClient.executiveAction(contractEDP007, bobby.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1)
    block.receipts[1].result.expectOk().expectUint(2)
    block.receipts[2].result.expectErr().expectUint(ExecutorDaoErrCode.err_unauthorised)

    ede004EmergencyExecuteClient.getSignalsRequired().result.expectUint(3)
    ede004EmergencyExecuteClient.isExecutiveTeamMember(phil.address).result.expectBool(true)
    exeDaoClient.isExtension(contractEDE000).result.expectBool(true)
    exeDaoClient.isExtension(contractEDE001).result.expectBool(true)
    exeDaoClient.isExtension(contractEDE002).result.expectBool(true)
    exeDaoClient.isExtension(contractEDE004).result.expectBool(false)
  }
});
