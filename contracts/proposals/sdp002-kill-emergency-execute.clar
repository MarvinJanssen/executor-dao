;; Title: SDP002 Kill Emergency Execute
;; Author: Marvin Janssen
;; Synopsis:
;; This proposal disables extension "SDE004 Emergency Execute".
;; Description:
;; If this proposal passes, extension "SDE004 Emergency Execute" is immediately
;; disabled.

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(contract-call? .executor-dao set-extension .sde004-emergency-execute false)
)
