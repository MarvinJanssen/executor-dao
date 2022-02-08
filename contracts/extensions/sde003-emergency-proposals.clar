;; Title: SDE003 Emergency Proposals
;; Original Author: Marvin Janssen
;; Maintaining Author: Ryan Waits
;; Depends-On: SDE001
;; Synopsis:
;; This extension allows for the creation of emergency proposals by a few trusted
;; principals.
;; Description:
;; Emergency proposals have a voting period of roughly 1 day, instead of the
;; normal proposal duration. Only a list of trusted principals, designated as the
;; "emergency team", can create emergency proposals. The emergency proposal
;; extension has a ~3 month sunset period, after which no more emergency
;; proposals can be made. The emergency team members, sunset period, and 
;; emergency vote duration can be changed by means of a future proposal.

(use-trait proposal-trait .proposal-trait.proposal-trait)

(impl-trait .extension-trait.extension-trait)

(define-constant ERR_UNAUTHORIZED (err u2700))
(define-constant ERR_NOT_EMERGENCY_TEAM_MEMBER (err u2701))
(define-constant ERR_SUNSET_HEIGHT_REACHED (err u2702))
(define-constant ERR_SUNSET_HEIGHT_IN_PAST (err u2703))

(define-data-var emergencyProposalDuration uint u144) ;; ~1 day
(define-data-var emergencyTeamSunsetHeight uint (+ block-height u13140)) ;; ~3 months from deploy time

(define-map EmergencyTeam principal bool)

;; --- Authorization check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; --- Internal DAO functions

(define-public (set-emergency-proposal-duration (duration uint))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set emergencyProposalDuration duration))
	)
)

(define-public (set-emergency-team-sunset-height (height uint))
	(begin
		(try! (is-dao-or-extension))
		(asserts! (> height block-height) ERR_SUNSET_HEIGHT_IN_PAST)
		(ok (var-set emergencyTeamSunsetHeight height))
	)
)

(define-public (set-emergency-team-member (who principal) (member bool))
	(begin
		(try! (is-dao-or-extension))
		(ok (map-set EmergencyTeam who member))
	)
)

;; --- Public functions

(define-read-only (is-emergency-team-member (who principal))
	(default-to false (map-get? EmergencyTeam who))
)

(define-public (emergency-propose (proposal <proposal-trait>))
	(begin
		(asserts! (is-emergency-team-member tx-sender) ERR_NOT_EMERGENCY_TEAM_MEMBER)
		(asserts! (< block-height (var-get emergencyTeamSunsetHeight)) ERR_SUNSET_HEIGHT_REACHED)
		(contract-call? .sde001-proposal-voting add-proposal proposal
			{
				startBlockHeight: block-height,
				endBlockHeight: (+ block-height (var-get emergencyProposalDuration)),
				proposer: tx-sender
			}
		)
	)
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
