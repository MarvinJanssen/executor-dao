import { 
  Clarinet, 
  Tx, 
  Chain, 
  Account, 
  types, 
} from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { PROPOSALS } from './utils/contract-addresses.ts';

export enum ErrCode {
  ERR_UNAUTHORIZED = 1000,
  ERR_ALREADY_EXECUTED = 1001,
  ERR_INVALID_EXTENSION = 1002,
}

export class ExecutorDao {
  chain: Chain;

  constructor(chain: Chain) {
    this.chain = chain;
  }

  initialize(sender: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall('executor-dao', 'initialize', [types.principal(PROPOSALS.sdp000Bootstrap)], sender.address),
    ]);

    return block.receipts[0].result;
  }

  isExtension(sender: Account, extension: any) {
    let block = this.chain.mineBlock([
      Tx.contractCall('executor-dao', 'is-extension', [extension], sender.address),
    ]);

    return block.receipts[0].result;
  }
}