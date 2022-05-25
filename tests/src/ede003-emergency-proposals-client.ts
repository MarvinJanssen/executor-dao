import {
  Tx,
  Chain,
  Account,
  types,
  ReadOnlyFn,
} from "https://deno.land/x/clarinet@v0.28.1/index.ts";

export enum EDE003EmergencyProposalsErrCode {
  err_unauthorised=3000,
  err_not_emergency_team_member=3001,
  err_sunset_height_reached=3002,
  err_sunset_height_in_past=3003
}

export class EDE003EmergencyProposalsClient {
  contractName = "";
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account, contractName: string) {
    this.contractName = contractName;
    this.chain = chain;
    this.deployer = deployer;
  }

  setEmergencyTeaMmember(who: string, member: boolean, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "set-emergency-team-member",
      [types.principal(who), types.bool(member)], txSender);
  }

  setEmergencyTeamSunsetHeight(height: number, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "set-emergency-team-sunset-height",
      [types.uint(height)], txSender);
  }

  setEmergencyProposalDuration(duration: number, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "set-emergency-proposal-duration",
      [types.uint(duration)], txSender);
  }

  emergencyPropose(proposal: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "emergency-propose",
      [types.principal(proposal)], txSender);
  }

  isEmergencyTeamMember(who: string): ReadOnlyFn {
    return this.callReadOnlyFn("is-emergency-team-member", [types.principal(who)]);
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
