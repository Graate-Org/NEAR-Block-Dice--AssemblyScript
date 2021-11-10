#!/usr/bin/env bash

# export function createdNewGame(): GameID
near call $CONTRACT createNewGame --account_id $OWNER --amount 0.5

exit 0