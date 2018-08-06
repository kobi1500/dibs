#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error, print all commands.
set -e

# Shut down the Docker containers for the system tests.
 docker-compose -f docker-compose-cli.yaml down



# remove docker containers
  docker rm -f $(docker ps -aq)
# remove networks
 docker network prune

# remove volumes
docker volume prune



# Your system is now clean
