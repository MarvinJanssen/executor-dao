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

;; Title: SDP006 Add Member
;; Author: StackerDAO Dev Team
;; Synopsis:
;; This proposal creates gives the existing members to add new members to the DAO.
;; Description:
;; If this proposal passes, it adds a new member to the DAO. This member will have
;; all the same rights as the existing members. In order to remove a member, another
;; proposal will need to be created and passed to remove them from the DAO.

(impl-trait .proposal-trait.proposal-trait)

(define-constant newMemberAddress 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC)

(define-public (execute (sender principal))
  (contract-call? .sde006-membership set-member newMemberAddress true)
)
