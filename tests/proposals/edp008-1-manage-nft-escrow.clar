;; Title: EDP000 Bootstrap
;; Author: Marvin Janssen
;; Synopsis:
;; Boot proposal that sets the governance token, DAO parameters, and extensions, and
;; mints the initial governance tokens.
;; Description:
;; Mints the initial supply of governance tokens and enables the the following 
;; extensions: "EDE000 Governance Token", "EDE001 Proposal Voting",
;; "EDE002 Proposal Submission", "EDE003 Emergency Proposals",
;; "EDE004 Emergency Execute".

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		;; Change governance token.
		(try! (contract-call? .nft-escrow set-allowed 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sip009-nft true))

		(print "Unit Test: ExecutorDAO emergency executive extension settings updated.")
		(ok true)
	)
)
