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
		(try! (contract-call? .ede000-governance-token edg-mint-many
			(list
				{amount: u1000, recipient: sender}
				{amount: u1000, recipient: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5}
			)
		))

		(try! (contract-call? .ede000-governance-token edg-mint u2000 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC))
		(try! (contract-call? .ede000-governance-token edg-burn u500 sender))
		(try! (contract-call? .ede000-governance-token edg-lock u500 sender))
		(try! (contract-call? .ede000-governance-token edg-unlock u10 sender))
		(try! (contract-call? .ede000-governance-token edg-transfer u10 sender 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG))

		(try! (contract-call? .ede000-governance-token edg-burn u100 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
		(try! (contract-call? .ede000-governance-token edg-lock u1500 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
		(try! (contract-call? .ede000-governance-token edg-unlock u15 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))

		(print "Unit Test: ExecutorDAO governance tokens minted, burned, locked unlocked and transferred.")
		(ok true)
	)
)
