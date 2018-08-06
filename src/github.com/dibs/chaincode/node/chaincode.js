/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

'use strict';
const shim = require('fabric-shim');
const util = require('util');




let Chaincode = class {

  // The Init method is called when the Smart Contract 'fabcar' is instantiated by the blockchain network
  // Best practice is to have any Ledger initialization in separate function -- see initLedger()
  async Init(stub) {
    console.info('=========== Instantiated chaincode ===========');
    return shim.success();
  }

  // The Invoke method is called as a result of an application request to run the Smart Contract
  // 'fabcar'. The calling application program has also specified the particular smart contract
  // function to be called, with arguments
  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);

    let method = this[ret.fcn];
    if (!method) {
      console.error('no function of name:' + ret.fcn + ' found');
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async GetUser(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting number of id ex: USER0');
    }
    let IdNumber = args[0];

    let id = await stub.getState(IdNumber);
    if (!id || id.toString().length <= 0) {
      throw new Error(id + ' does not exist: ');
    }
    console.log(id.toString());
    return id;
  }

  async initLedger(stub, args) {
    function randomString() {

      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789";
      var string_length = 8;
      var randomstring = '';

      for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
      }
      return randomstring;
    }

    console.info('============= START : Initialize Ledger ===========');

    let users = [];
    users.push({
      id: randomString(),
      firstName: 'kobi',
      lastName: 'dahan',
      accountNumber: randomString()
    });
    users.push({
      id: randomString(),
      firstName: 'tamar',
      lastName: 'carmon',
      accountNumber: randomString()
    });
    users.push({
      id: randomString(),
      firstName: 'alex',
      lastName: 'shoyhit',
      accountNumber: randomString()
    });


    for (let i = 0; i < users.length; i++) {
      users[i].docType = 'user';
      await stub.putState('USER' + i, Buffer.from(JSON.stringify(users[i])));
      console.info('Added <--> ', users[i]);
    }




    console.log('============= END : Initialize Ledger ===========');
  }

  async createUser(stub, args) {
    function randomString() {

      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789";
      var string_length = 8;
      var randomstring = '';

      for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
      }
      return randomstring;
    }

    console.info('============= START : Create User ===========');
    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3');
    }

    var user = {
      docType: 'user',
      id: randomString(),
      firstName: args[1],
      lastName: args[2],
      AccountNumber: randomString()
    };


    await stub.putState('USER' + args[0], Buffer.from(JSON.stringify(user)));
    console.log(user);
    console.info('============= END : Create User ===========');

  }

  async GetAllUsers(stub, args) {

    let startKey = 'USER0';
    let endKey = 'USER999999999';

    let iterator = await stub.getStateByRange(startKey, endKey);

    let allResults = [];
    while (true) {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        jsonRes.Key = res.value.key;
        try {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString('utf8');
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.log(allResults);
        return Buffer.from(JSON.stringify(allResults));
      }
    }
  }

  async delete(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let A = args[0];

    // Delete the key from the state in ledger
    await stub.deleteState(A);
  }




  async CreateAccount(stub, args) {
    function randomString() {

      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789";
      var string_length = 8;
      var randomstring = '';

      for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
      }
      return randomstring;
    }

    console.info('============= START : Create Account ===========');
    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3');
    }
 
    let user = await stub.getState(args[0]);
    if (!user || user.toString().length <= 0) {
      throw new Error(args[0].toString() + ' does not exist: ');
    }else{
    var ConvertUser=JSON.parse(user);
    
    var account = {
      docType: 'account',
      AccountNumber: ConvertUser.accountNumber,
      AccountId:randomString(),
      owner: ConvertUser.firstName + " " + ConvertUser.lastName,
      balance: args[1],

    };
    await stub.putState('ACCOUNT' + args[2], Buffer.from(JSON.stringify(account)));
    console.log(account);
    console.log('============= END : Create Account ===========');
  }
  }

  async GetAccount(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting number of id ex: account0');
    }
    let IdNumber = args[0];

    let id = await stub.getState(IdNumber);
    if (!id || id.toString().length <= 0) {
      throw new Error(id + ' does not exist: ');
    }
    console.log(id.toString());
    return id;
  }

  async Transfer(stub, args) {
    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3');
    }
    
    let account1 = args[0];
    let account2 = args[1];
    if (!account1 || !account2) {
      throw new Error('asset holding must not be empty');
    }

    // Get the state from the ledger
    let AccountDataAccount1 = await stub.getState(account1);
    var data=JSON.parse(AccountDataAccount1);
       let AccountDataAccount2 = await stub.getState(account2);
     var toAccount2 = JSON.parse(AccountDataAccount2);
  // console.log(data);
  // console.log(toAccount2);
 
    let fromAccount1 ={
      docType:data.docType,
      AccountNumber:data.AccountNumber,
      AccountId:data.AccountId,
      owner:data.owner,
      balance:data.balance
    }
    let BalanceFromAccount1 = parseInt(fromAccount1.balance);

    let ToAccount2={
      docType:toAccount2.docType,
      AccountNumber:toAccount2.AccountNumber,
      AccountId:toAccount2.AccountId,
      owner:toAccount2.owner,
      balance: toAccount2.balance
    }
    // console.log(fromAccount1);
    // console.log(ToAccount2);
    let BalanceFromAccount2 = parseInt(ToAccount2.balance);
    // console.log(BalanceFromAccount1.toString());
    // console.log(BalanceFromAccount2.toString());
    //Perform the execution
    let amount = parseInt(args[2]);
    if (typeof amount !== 'number') {
      throw new Error('Expecting integer value for amount to be transaferred');
    }

    AccountDataAccount1 = BalanceFromAccount1 - amount;
    AccountDataAccount2 = BalanceFromAccount2 + amount;
    fromAccount1.balance = AccountDataAccount1;
    ToAccount2.balance = AccountDataAccount2;
  
    // Write the states back to the ledger
    await stub.putState(account1, Buffer.from(JSON.stringify(fromAccount1)));
    await stub.putState(account2, Buffer.from(JSON.stringify(ToAccount2)));
 
    console.log(`${fromAccount1.owner} give ${amount} to ${ToAccount2.owner}`);
    console.log(`The new balance of accounts is: ${fromAccount1.owner} is have ${fromAccount1.balance} \n ${ToAccount2.owner} is have ${ToAccount2.balance}`);

  }
  async GetAllAccounts(stub, args) {

    let startKey = 'ACCOUNT0';
    let endKey = 'ACCOUNT999999999';

    let iterator = await stub.getStateByRange(startKey, endKey);
    let allResults = [];
    while (true) {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        jsonRes.Key = res.value.key;
        try {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString('utf8');
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.log(allResults);
        return Buffer.from(JSON.stringify(allResults));
      }
    }
  }


};

shim.start(new Chaincode());
