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

;; --- TESTING ---
;; Title: SDP008-Proposal-Submission
;; Author: StackerDAO Dev Team
;; Synopsis:
;; This proposal will test the ability of a proposal to make modifications to extension rules for SDE008-Proposal-Submission
;; Description:
;; If this proposal passes, it should
;; 1. Change the membership contract governing the DAO
;; 2. Change the proposal duration to ~ 2 weeks
;; 3. Increase the min start delay for voting to ~ 2 days
;; 4. Increase the max start delay for voting to ~ 14 days

(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
  (begin
    (try! (contract-call? .executor-dao set-extension .sde006-test-membership true))
    (try! (contract-call? .sde008-proposal-submission set-member-contract .sde006-test-membership))
    (try! (contract-call? .executor-dao set-extension .sde006-membership false))
    (try! (contract-call? .sde008-proposal-submission set-parameter "proposalDuration" u2016)) ;; increase proposal duration to 2 weeks
    ;; set min delay to 2 days and max delay to 14 days
    (try! (contract-call? .sde008-proposal-submission set-parameters 
      (list
        {parameter: "minimumProposalStartDelay", value: u288}
        {parameter: "maximumProposalStartDelay", value: u2016}
      )
    ))
    (ok true)
  )
)
