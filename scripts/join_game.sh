# export function joinGame(): GameID
near call $CONTRACT joinGame --account_id $PLAYER '{"gameId": "BD-689191485"}' --amount 0.5

exit 0