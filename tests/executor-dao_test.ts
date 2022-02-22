import { 
  Account, 
  Clarinet,
  Chain, 
  types,
} from './models/utils/helpers.ts';
import { ExecutorDao, EXECUTOR_DAO_CODES } from './models/executor-dao-model.ts';
import { EXTENSIONS, PROPOSALS } from './models/utils/contract-addresses.ts';

Clarinet.test({
  name: 'ExecutorDao',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let Dao = new ExecutorDao(chain);
    let result : any = null;
  
    // check if the extension is enabled
    result = await Dao.isExtension(deployer, types.principal(EXTENSIONS.sde009Safe));
    result.expectBool(false);

    // initialize the DAO with enabled extensions for .sde009-safe
    result = await Dao.initialize(deployer);
    result.expectOk().expectBool(true);

    // once already called, initialize can only be called by the dao or enabled extensions 
    result = await Dao.initialize(deployer);
    result.expectErr().expectUint(EXECUTOR_DAO_CODES.ERR_UNAUTHORIZED);

    // check if the extension is now enabled
    result = await Dao.isExtension(deployer, types.principal(EXTENSIONS.sde009Safe));
    result.expectBool(true);

    // fail to set-extension without going through a proposal
    result = await Dao.setExtension(deployer, types.principal(EXTENSIONS.sde009Safe), types.bool(false));
    result.expectErr().expectUint(EXECUTOR_DAO_CODES.ERR_UNAUTHORIZED);

    // fail to execute a proposal without going through proposal process
    result = await Dao.execute(deployer, types.principal(PROPOSALS.sdp004SendFunds));
    result.expectErr().expectUint(EXECUTOR_DAO_CODES.ERR_UNAUTHORIZED);
  },
});
