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
		(try! (contract-call? .ede002-proposal-submission set-parameter "minimum-proposal-start-delay" u288))
		(try! (contract-call? .ede003-emergency-proposals set-emergency-team-member 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC true))
		(try! (contract-call? .ede004-emergency-execute set-signals-required u2))

		(print "Unit Test: ExecutorDAO random sample config changed.")
		(ok true)
	)
)
