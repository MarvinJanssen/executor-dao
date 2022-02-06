;; Title: SDP000 Initialize
;; Author: Marvin Janssen
;; Synopsis:
;; Boot proposal that sets the governance token, DAO parameters, and extensions, and
;; mints the initial governance tokens.
;; Description:
;; Mints the initial supply of governance tokens and enables the the following 
;; extensions: "SDE000 Governance Token", "SDE001 Proposal Voting",
;; "SDE002 Proposal Submission", "SDE003 Emergency Proposals",
;; "SDE004 Emergency Execute".

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(begin
		;; Enable genesis extensions.
		(try! (contract-call? .executor-dao set-extensions
			(list
				{extension: .sde003-emergency-proposals, enabled: true}
				{extension: .sde004-emergency-execute, enabled: true}
				{extension: .sde006-membership, enabled: true}
				{extension: .sde007-membership-proposal-voting, enabled: true}
				{extension: .sde008-membership-proposal-submission, enabled: true}
				{extension: .sde009-vault, enabled: true}
			)
		))

		;; Set emergency team members.
		(try! (contract-call? .sde003-emergency-proposals set-emergency-team-member 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM true))
		(try! (contract-call? .sde003-emergency-proposals set-emergency-team-member 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 true))

		;; Set executive team members.
		(try! (contract-call? .sde004-emergency-execute set-executive-team-member 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM true))
		(try! (contract-call? .sde004-emergency-execute set-executive-team-member 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 true))
		(try! (contract-call? .sde004-emergency-execute set-executive-team-member 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG true))
		(try! (contract-call? .sde004-emergency-execute set-executive-team-member 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC true))
		(try! (contract-call? .sde004-emergency-execute set-signals-required u3)) ;; signal from 3 out of 4 team members requied.

		;; Add initial DAO members
		(try! (contract-call? .sde006-membership set-member 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM true))
		(try! (contract-call? .sde006-membership set-member 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 true))
		(try! (contract-call? .sde006-membership set-member 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG true))
		(try! (contract-call? .sde006-membership set-member 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC true))
		(try! (contract-call? .sde006-membership set-member 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND true))
		(try! (contract-call? .sde006-membership set-member 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB true))
		(try! (contract-call? .sde006-membership set-member 'ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0 true))

		(print "It's goin DAOn...")
		(ok true)
	)
)
