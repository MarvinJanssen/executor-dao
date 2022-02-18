
import { 
  Clarinet, 
  Tx, 
  Chain, 
  Account, 
  types, 
} from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { ExecutorDao, ErrCode } from './models/executor-dao-model.ts';
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

    // initialize the contract with extensions
    result = await Dao.initialize(deployer);
    result.expectOk().expectBool(true);

    // check if the extension is now enabled
    result = await Dao.isExtension(deployer, types.principal(EXTENSIONS.sde009Safe));
    result.expectBool(true);
  },
});
