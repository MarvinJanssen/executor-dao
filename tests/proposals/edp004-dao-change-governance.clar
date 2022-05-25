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
		(try! (contract-call? .ede000-governance-token set-symbol "EDG2"))
		(try! (contract-call? .ede000-governance-token set-name "New Governance Token"))
		(try! (contract-call? .ede000-governance-token set-token-uri (some u"https://docs.hiro.so/get-started/running-api-node")))
		(try! (contract-call? .ede000-governance-token set-decimals u2))

		(print "Unit Test: ExecutorDAO governance token sip 010 config changed.")
		(ok true)
	)
)
