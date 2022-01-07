#!/bin/zsh
# clarity-cli and jq required.
cd "$(dirname "$0")"
deployer=$(cat initial-allocations.json | jq ".[0].principal" -r)
deploy_order=(
	# traits
	"traits/extension-trait.clar" "traits/governance-token-trait.clar" "traits/ownable-trait.clar" "traits/proposal-trait.clar" "traits/sip010-ft-trait.clar"
	# ExecutorDAO
	"executor-dao.clar"
	# Extensions
	"extensions/ede000-governance-token.clar" "extensions/ede001-proposal-voting.clar" "extensions/ede002-proposal-submission.clar" "extensions/ede003-emergency-proposals.clar" "extensions/ede004-emergency-execute.clar" "extensions/ede005-dev-fund.clar"
	# Proposals
	"proposals/edp000-bootstrap.clar" "proposals/edp001-dev-fund.clar" "proposals/edp002-kill-emergency-execute.clar"
	)
vmstate="vmstate.db"

rm -rf "$vmstate"
clarity-cli initialize --testnet initial-allocations.json "$vmstate"
for contract in "${deploy_order[@]}"; do
	echo "LAUNCH $contract"
	clarity-cli launch "$deployer.$(basename $contract .clar)" "../contracts/$contract" "$vmstate"
done
echo "BOOTSTRAP"
result=$(clarity-cli execute "$vmstate" "$deployer.executor-dao" "construct" "$deployer" "'$deployer.edp000-bootstrap")
if [[ $(echo $result | jq ".success") == "true" ]]; then
	echo "OK"
else
	echo "FAILED"
	exit 1
fi
rm -rf "$vmstate"
