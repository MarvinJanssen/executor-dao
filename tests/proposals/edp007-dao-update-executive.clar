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
		(try! (contract-call? .ede004-emergency-execute set-executive-team-member 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 false))
		(try! (contract-call? .ede004-emergency-execute set-executive-team-member 'STNHKEPYEPJ8ET55ZZ0M5A34J0R3N5FM2CMMMAZ6 true))
		(try! (contract-call? .ede004-emergency-execute set-signals-required u4))

		(print "Unit Test: ExecutorDAO emergency executive extension settings updated.")
		(ok true)
	)
)
