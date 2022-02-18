
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { ErrCode } from './models/sde000-governance-token-model.ts';
import { CONTRACTS } from './models/utils/contract-addresses.ts';

Clarinet.test({
  name: 'Throws ERR_UNAUTHORIZED when not called by DAO (executive principal) or an enabled Extension',
  async fn(chain: Chain, accounts: Map<string, Account>) {
      let deployer = accounts.get('deployer')!;

      let block = chain.mineBlock([
        Tx.contractCall('sde000-governance-token', 'is-dao-or-extension', [], deployer.address),
      ]);

      assertEquals(block.receipts.length, 1);
      assertEquals(block.height, 2);

      block.receipts[0].result.expectErr().expectUint(ErrCode.ERR_UNAUTHORIZED);
  },
});
