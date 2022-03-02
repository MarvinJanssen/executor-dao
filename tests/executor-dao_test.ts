import { 
  Account,
  assertEquals,
  Clarinet,
  Chain,
  types,
} from './utils/helpers.ts';
import { ExecutorDao, EXECUTOR_DAO_CODES } from './models/executor-dao-model.ts';
import { EXTENSIONS, PROPOSALS } from './utils/contract-addresses.ts';

Clarinet.test({
  name: 'ExecutorDao',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let Dao = new ExecutorDao(chain);
    let data: any;
  
    // check if the extension is enabled
    data = await Dao.isExtension(deployer, types.principal(EXTENSIONS.sde009Safe));
    data.result.expectBool(false);

    // initialize the DAO with enabled extensions for .sde009-safe
    data = await Dao.initialize(deployer);
    assertEquals(data.events.length, 9);
    data.result.expectOk().expectBool(true);

    // // once already called, initialize can only be called by the dao or enabled extensions 
    data = await Dao.initialize(deployer);
    assertEquals(data.events.length, 0);
    data.result.expectErr().expectUint(EXECUTOR_DAO_CODES.ERR_UNAUTHORIZED);

    // // check if the extension is now enabled
    data = await Dao.isExtension(deployer, types.principal(EXTENSIONS.sde009Safe));
    data.result.expectBool(true);

    // // fail to set-extension without going through a proposal
    data = await Dao.setExtension(deployer, types.principal(EXTENSIONS.sde009Safe), types.bool(false));
    data.result.expectErr().expectUint(EXECUTOR_DAO_CODES.ERR_UNAUTHORIZED);

    // // fail to execute a proposal without going through proposal process
    data = await Dao.execute(deployer, types.principal(PROPOSALS.sdp004SendFunds));
    data.result.expectErr().expectUint(EXECUTOR_DAO_CODES.ERR_UNAUTHORIZED);
  },
});
