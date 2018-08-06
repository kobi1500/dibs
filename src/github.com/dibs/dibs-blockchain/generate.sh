#!/bin/sh
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

export FABRIC_CFG_PATH=${PWD}
export CHANNEL_NAME=mychannel

# remove previous crypto material and config transactions
rm -fr channel-artifacts/*
rm -fr crypto-config/*



# generate crypto material
bin/cryptogen generate --config=./crypto-config.yaml
if [ "$?" -ne 0 ]; then
  echo "Failed to generate crypto material..."
  exit 1
fi

# create folder channel-artifacts
 mkdir channel-artifacts

# generate genesis block for orderer
bin/configtxgen -profile DibsOrdererGenesis -outputBlock ./channel-artifacts/genesis.block
if [ "$?" -ne 0 ]; then
  echo "Failed to generate orderer genesis block..."
  exit 1
fi

# generate channel configuration transaction
 bin/configtxgen -profile OneOrgsChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID $CHANNEL_NAME
if [ "$?" -ne 0 ]; then
  echo "Failed to generate channel configuration transaction..."
  exit 1
fi

# generate anchor peer transaction
bin/configtxgen -profile OneOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg DibsMSP
if [ "$?" -ne 0 ]; then
  echo "Failed to generate anchor peer update for DibsMSP..."
  exit 1
fi


