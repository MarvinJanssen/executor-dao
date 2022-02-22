import { 
  Account, 
  Chain, 
  Tx 
} from './utils/helpers.ts';
import { PROPOSALS } from './utils/contract-addresses.ts';

export enum SDE006_MEMBERSHIP_CODES {
  ERR_UNAUTHORIZED = 2900,
  ERR_NOT_A_MEMBER = 2901,
}

export class SDE006Membership {
  chain: Chain;

  constructor(chain: Chain) {
    this.chain = chain;
  };

  setMember(sender: Account, who: string, isMember: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde006-membership', 'set-member', [who, isMember], sender.address),
    ]);

    return block.receipts[0].result;
  };

  setBlacklist(sender: Account, who: string, isMember: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde006-membership', 'set-blacklist', [who, isMember], sender.address),
    ]);

    return block.receipts[0].result;
  };

  isMember(sender: Account, who: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde006-membership', 'is-member', [who], sender.address),
    ]);

    return block.receipts[0].result;
  };

  isBlacklisted(sender: Account, who: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde006-membership', 'is-blacklisted', [who], sender.address),
    ]);

    return block.receipts[0].result;
  };

  callback(sender: Account, memo: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall('sde006-membership', 'callback', [memo], sender.address),
    ]);

    return block.receipts[0].result;
  };
};