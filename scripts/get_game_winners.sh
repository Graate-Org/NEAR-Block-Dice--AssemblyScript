# export function getWinners(): GameID
near call $CONTRACT getWinners '{"gameId": "BD-689191485"}' --account_id $OWNER

exit 0