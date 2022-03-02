import { 
  Account, 
  Chain, 
  Tx,
  types,
} from '../utils/helpers';
import { EXTENSIONS } from '../utils/contract-addresses';

export enum ErrCode {
  ERR_UNAUTHORIZED = 2400,
  ERR_NOT_TOKEN_OWNER = 4,
}

export class SDE000Governacnce {
  chain: Chain;

  constructor(chain: Chain) {
    this.chain = chain;
  };

  sdg-transfer() {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde000GovernanceToken', 'sdg-transfer', [], sender.address),
    ]);

    return { result: block.receipts[0].result, events: block.receipts[0].events};
  };
