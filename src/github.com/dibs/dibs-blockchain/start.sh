#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error, print all commands.
set -ev

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

docker-compose -f docker-compose-cli.yaml up -d 

# wait for Hyperledger Fabric to start
# incase of errors when running later commands, issue export FABRIC_START_TIMEOUT=<larger number>
export FABRIC_START_TIMEOUT=10
export CHANNEL_NAME=mychannel
#echo ${FABRIC_START_TIMEOUT}
sleep ${FABRIC_START_TIMEOUT}

# enter to the docker container
 docker exec -it cli bash

export CHANNEL_NAME=mychannel
# Create the channel
peer channel create -o orderer.dibs.cash:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/dibs.cash/orderers/orderer.dibs.cash/msp/tlscacerts/tlsca.dibs.cash-cert.pem

# Join peer0.dibs.cash to the channel.
peer channel join -b mychannel.block

#update anchor peers of channel
peer channel update -o orderer.dibs.cash:7050 -c $CHANNEL_NAME -f ./channel-artifacts/Org1MSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/dibs.cash/orderers/orderer.dibs.cash/msp/tlscacerts/tlsca.dibs.cash-cert.pem


#install chaincode

peer chaincode install -n mychaincode -l node -v 0.0.1 -p ../../../chaincode/node/


#instantiate chaincode
export CHANNEL_NAME=mychannel
 peer chaincode instantiate -o orderer.dibs.cash:7050 --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/dibs.cash/orderers/orderer.dibs.cash/msp/tlscacerts/tlsca.dibs.cash-cert.pem -C $CHANNEL_NAME -n mychaincode -v 0.0.1 -l node -c '{"Args":["initLedger"]}' -P "OR ('DibsMSP.member')"

#query
 peer chaincode query -C $CHANNEL_NAME -n mychaincode  -c '{"Args":["query","a"]}'

#invoke the query
peer chaincode invoke -o orderer.dibs.cash:7050  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/dibs.cash/orderers/orderer.dibs.cash/msp/tlscacerts/tlsca.dibs.cash-cert.pem  -C $CHANNEL_NAME -n mychaincode -c '{"Args":["initLedger"]}'

#query of results
 peer chaincode query -C $CHANNEL_NAME -n mychaincode -c '{"Args":["query","a"]}'
 peer chaincode query -C $CHANNEL_NAME -n mychaincode -c '{"Args":["query","b"]}'





