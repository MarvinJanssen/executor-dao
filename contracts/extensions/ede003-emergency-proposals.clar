;; Title: EDE003 Emergency Proposals
;; Author: Marvin Janssen
;; Depends-On: EDE001
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

(impl-trait .extension-trait.extension-trait)
(use-trait proposal-trait .proposal-trait.proposal-trait)

(define-data-var emergency-proposal-duration uint u144) ;; ~1 day
(define-data-var emergency-team-sunset-height uint (+ block-height u13140)) ;; ~3 months from deploy time

(define-constant err-unauthorised (err u3000))
(define-constant err-not-emergency-team-member (err u3001))
(define-constant err-sunset-height-reached (err u3002))
(define-constant err-sunset-height-in-past (err u3003))

(define-map emergency-team principal bool)

;; --- Authorisation check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) err-unauthorised))
)

;; --- Internal DAO functions

(define-public (set-emergency-proposal-duration (duration uint))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set emergency-proposal-duration duration))
	)
)

(define-public (set-emergency-team-sunset-height (height uint))
	(begin
		(try! (is-dao-or-extension))
		(asserts! (> height block-height) err-sunset-height-in-past)
		(ok (var-set emergency-team-sunset-height height))
	)
)

(define-public (set-emergency-team-member (who principal) (member bool))
	(begin
		(try! (is-dao-or-extension))
		(ok (map-set emergency-team who member))
	)
)

;; --- Public functions

(define-read-only (is-emergency-team-member (who principal))
	(default-to false (map-get? emergency-team who))
)

(define-public (emergency-propose (proposal <proposal-trait>))
	(begin
		(asserts! (is-emergency-team-member tx-sender) err-not-emergency-team-member)
		(asserts! (< block-height (var-get emergency-team-sunset-height)) err-sunset-height-reached)
		(contract-call? .ede001-proposal-voting add-proposal proposal
			{
				start-block-height: block-height,
				end-block-height: (+ block-height (var-get emergency-proposal-duration)),
				proposer: tx-sender
			}
		)
	)
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
