import { 
  Account, 
  Chain, 
  Tx,
  types,
} from '../utils/helpers.ts';
import { PROPOSALS } from '../utils/contract-addresses.ts';

export enum EXECUTOR_DAO_CODES {
  ERR_UNAUTHORIZED = 1000,
  ERR_ALREADY_EXECUTED = 1001,
  ERR_INVALID_EXTENSION = 1002,
}

export class ExecutorDao {
  chain: Chain;

  constructor(chain: Chain) {
    this.chain = chain;
  }

  isExtension(sender: Account, extension: any) {
    let block = this.chain.mineBlock([
      Tx.contractCall('executor-dao', 'is-extension', [extension], sender.address),
    ]);

    return { result: block.receipts[0].result, events: block.receipts[0].events };
  }

  setExtension(sender: Account, extension: any, enabled: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('executor-dao', 'set-extension', [extension, enabled], sender.address),
    ]);

    return { result: block.receipts[0].result, events: block.receipts[0].events };
  }

  setExtensions(sender: Account, extensionsList: any) {
    let block = this.chain.mineBlock([
      Tx.contractCall('executor-dao', 'set-extensions', [extensionsList], sender.address),
    ]);

    return { result: block.receipts[0].result, events: block.receipts[0].events };
  }

  executedAt(sender: Account, proposal: any) {
    let block = this.chain.mineBlock([
      Tx.contractCall('executor-dao', 'executed-at', [proposal], sender.address),
    ]);

    return { result: block.receipts[0].result, events: block.receipts[0].events };
  }

  execute(sender: Account, proposal: any) {
    let block = this.chain.mineBlock([
      Tx.contractCall('executor-dao', 'execute', [proposal, types.principal(sender.address)], sender.address),
    ]);

    return { result: block.receipts[0].result, events: block.receipts[0].events };
  }

  initialize(sender: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall('executor-dao', 'initialize', [types.principal(PROPOSALS.sdp000Bootstrap)], sender.address),
    ]);

    return { result: block.receipts[0].result, events: block.receipts[0].events };
  }

  requestExtensionCallback(sender: Account, extension: any, memo: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('executor-dao', 'request-extension-callback', [extension, memo], sender.address),
    ]);

    return { result: block.receipts[0].result, events: block.receipts[0].events };
  }
}