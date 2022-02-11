;;     _____________  _______ _________  ___  ___  ____  ____
;;     / __/_  __/ _ |/ ___/ //_/ __/ _ \/ _ \/ _ |/ __ \/ __/
;;     _\ \  / / / __ / /__/ ,< / _// , _/ // / __ / /_/ /\ \  
;;    /___/ /_/ /_/ |_\___/_/|_/___/_/|_/____/_/ |_\____/___/  
;;                                                          
;;     ___  ___  ____  ___  ____  _______   __               
;;    / _ \/ _ \/ __ \/ _ \/ __ \/ __/ _ | / /               
;;   / ___/ , _/ /_/ / ___/ /_/ /\ \/ __ |/ /__              
;;  /_/  /_/|_|\____/_/   \____/___/_/ |_/____/              
;;                                                         

;; Title: SDP002 Kill Emergency Execute
;; Author: Marvin Janssen / StackerDAO Dev Team
;; Synopsis:
;; This proposal disables extension "SDE004 Emergency Execute".
;; Description:
;; If this proposal passes, extension "SDE004 Emergency Execute" is immediately
;; disabled.

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
	(contract-call? .executor-dao set-extension .sde004-emergency-execute false)
)
