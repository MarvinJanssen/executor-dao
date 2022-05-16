import {
  Tx,
  Chain,
  Account,
  types,
  ReadOnlyFn,
} from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { assertEquals, assert } from "https://deno.land/std@0.90.0/testing/asserts.ts";


export enum EDE002ProposalSubmissionErrCode {
  err_unauthorised=3100,
  err_not_governance_token=3101,
  err_insufficient_balance=3102,
  err_unknown_parameter=3103,
  err_proposal_minimum_start_delay=3104,
  err_proposal_maximum_start_delay=3105
}

export class EDE002ProposalSubmissionClient {
  contractName: string = "";
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account, contractName: string) {
    this.contractName = contractName;
    this.chain = chain;
    this.deployer = deployer;
  }

  getParameter(parameter: string, ): ReadOnlyFn {
    return this.callReadOnlyFn("get-parameter", [types.ascii(parameter)]);
  }

  propose(proposal: string, startBlockHeight: number, governanceToken: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "propose",
      [types.principal(proposal), types.uint(startBlockHeight), types.principal(governanceToken)], txSender);
  }

  private callReadOnlyFn(
    method: string,
    args: Array<any> = [],
    sender: Account = this.deployer
  ): ReadOnlyFn {
    const result = this.chain.callReadOnlyFn(
      this.contractName,
      method,
      args,
      sender?.address
    );

    return result;
  }
}
