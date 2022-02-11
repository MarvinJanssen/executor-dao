;;     _____________  _______ _________  ___  ___  ____  ____
;;     / __/_  __/ _ |/ ___/ //_/ __/ _ \/ _ \/ _ |/ __ \/ __/
;;     _\ \  / / / __ / /__/ ,< / _// , _/ // / __ / /_/ /\ \  
;;    /___/ /_/ /_/ |_\___/_/|_/___/_/|_/____/_/ |_\____/___/  
;;                                                          
;;     _____  _____________  ______________  _  __           
;;    / __/ |/_/_  __/ __/ |/ / __/  _/ __ \/ |/ /           
;;   / _/_>  <  / / / _//    /\ \_/ // /_/ /    /            
;;  /___/_/|_| /_/ /___/_/|_/___/___/\____/_/|_/             
;;                                                           

;; Title: SDE004 Emergency Execute
;; Author: Marvin Janssen / StackerDAO Dev Team
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

(use-trait proposal-trait .proposal-trait.proposal-trait)

(impl-trait .extension-trait.extension-trait)

(define-data-var executiveTeamSunsetHeight uint (+ block-height u4380)) ;; ~1 month from deploy time

(define-constant ERR_UNAUTHORIZED (err u2800))
(define-constant ERR_NOT_EXECUTIVE_TEAM_MEMBER (err u2801))
(define-constant ERR_ALREADY_EXECUTED (err u2802))
(define-constant ERR_SUNSET_HEIGHT_REACHED (err u2803))
(define-constant ERR_SUNSET_HEIGHT_IN_PAST (err u2804))

(define-map ExecutiveTeam principal bool)
(define-map ExecutiveActionSignals {proposal: principal, teamMember: principal} bool)
(define-map ExecutiveActionSignalCount principal uint)

(define-data-var executiveSignalsRequired uint u1) ;; signals required for an executive action.

;; --- Authorization check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; --- Internal DAO functions

(define-public (set-executive-team-sunset-height (height uint))
	(begin
		(try! (is-dao-or-extension))
		(asserts! (> height block-height) ERR_SUNSET_HEIGHT_IN_PAST)
		(ok (var-set executiveTeamSunsetHeight height))
	)
)

(define-public (set-executive-team-member (who principal) (member bool))
	(begin
		(try! (is-dao-or-extension))
		(ok (map-set ExecutiveTeam who member))
	)
)

(define-public (set-signals-required (newRequirement uint))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set executiveSignalsRequired newRequirement))
	)
)

;; --- Public functions

(define-read-only (is-executive-team-member (who principal))
	(default-to false (map-get? ExecutiveTeam who))
)

(define-read-only (has-signaled (proposal principal) (who principal))
	(default-to false (map-get? ExecutiveActionSignals {proposal: proposal, teamMember: who}))
)

(define-read-only (get-signals-required)
	(var-get executiveSignalsRequired)
)

(define-read-only (get-signals (proposal principal))
	(default-to u0 (map-get? ExecutiveActionSignalCount proposal))
)

(define-public (executive-action (proposal <proposal-trait>))
	(let
		(
			(proposalPrincipal (contract-of proposal))
			(signals (+ (get-signals proposalPrincipal) (if (has-signaled proposalPrincipal tx-sender) u0 u1)))
		)
		(asserts! (is-executive-team-member tx-sender) ERR_NOT_EXECUTIVE_TEAM_MEMBER)
		(asserts! (is-none (contract-call? .executor-dao executed-at proposal)) ERR_ALREADY_EXECUTED)
		(asserts! (< block-height (var-get executiveTeamSunsetHeight)) ERR_SUNSET_HEIGHT_REACHED)
		(and (>= signals (var-get executiveSignalsRequired))
			(try! (contract-call? .executor-dao execute proposal tx-sender))
		)
		(map-set ExecutiveActionSignals {proposal: proposalPrincipal, teamMember: tx-sender} true)
		(map-set ExecutiveActionSignalCount proposalPrincipal signals)
		(ok signals)
	)
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
