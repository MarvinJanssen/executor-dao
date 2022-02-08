;; Title: SDE004 Emergency Execute
;; Original Author: Marvin Janssen
;; Maintaining Author: Ryan Waits
;; Depends-On: 
;; Synopsis:
;; This extension allows a small number of very trusted principals to immediately
;; execute a proposal once a super majority is reached.
;; Description:
;; An extension meant for the bootstrapping period of a DAO. It temporarily gives
;; some very trusted principals the ability to perform an "executive action";
;; meaning, they can skip the voting process to immediately executive a proposal.
;; The Emergency Executive extension has a sunset period of ~1 month from deploy
;; time. Executive Team members, the parameters, and sunset period may be changed
;; by means of a future proposal.

(impl-trait .extension-trait.extension-trait)
(use-trait proposal-trait .proposal-trait.proposal-trait)

(define-data-var executive-team-sunset-height uint (+ block-height u4380)) ;; ~1 month from deploy time

(define-constant ERR_UNAUTHORIZED (err u2800))
(define-constant err-not-executive-team-member (err u2801))
(define-constant err-already-executed (err u2802))
(define-constant ERR_SUNSET_HEIGHT_REACHED (err u2803))
(define-constant ERR_SUNSET_HEIGHT_IN_PAST (err u2804))

(define-map executive-team principal bool)
(define-map executive-action-signals {proposal: principal, team-member: principal} bool)
(define-map executive-action-signal-count principal uint)

(define-data-var executive-signals-required uint u1) ;; signals required for an executive action.

;; --- Authorization check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; --- Internal DAO functions

(define-public (set-executive-team-sunset-height (height uint))
	(begin
		(try! (is-dao-or-extension))
		(asserts! (> height block-height) ERR_SUNSET_HEIGHT_IN_PAST)
		(ok (var-set executive-team-sunset-height height))
	)
)

(define-public (set-executive-team-member (who principal) (member bool))
	(begin
		(try! (is-dao-or-extension))
		(ok (map-set executive-team who member))
	)
)

(define-public (set-signals-required (new-requirement uint))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set executive-signals-required new-requirement))
	)
)

;; --- Public functions

(define-read-only (is-executive-team-member (who principal))
	(default-to false (map-get? executive-team who))
)

(define-read-only (has-signalled (proposal principal) (who principal))
	(default-to false (map-get? executive-action-signals {proposal: proposal, team-member: who}))
)

(define-read-only (get-signals-required)
	(var-get executive-signals-required)
)

(define-read-only (get-signals (proposal principal))
	(default-to u0 (map-get? executive-action-signal-count proposal))
)

(define-public (executive-action (proposal <proposal-trait>))
	(let
		(
			(proposalPrincipal (contract-of proposal))
			(signals (+ (get-signals proposalPrincipal) (if (has-signalled proposalPrincipal tx-sender) u0 u1)))
		)
		(asserts! (is-executive-team-member tx-sender) err-not-executive-team-member)
		(asserts! (< block-height (var-get executive-team-sunset-height)) ERR_SUNSET_HEIGHT_REACHED)
		(and (>= signals (var-get executive-signals-required))
			(try! (contract-call? .executor-dao execute proposal tx-sender))
		)
		(map-set executive-action-signals {proposal: proposalPrincipal, team-member: tx-sender} true)
		(map-set executive-action-signal-count proposalPrincipal signals)
		(ok signals)
	)
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
