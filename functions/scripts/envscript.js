'use strict';


const fs = require('fs');
const argument = process.argv[2];

switch(argument){

    case 'local':
        changeLocal();
        break;

    case 'prod':
        changeProd();
        break;

    default:
        showCurrent();

}

function changeLocal(){

    fs.createReadStream('./scripts/.env.local').pipe(fs.createWriteStream('./.env'));
    console.info("Switched to local environment");

}

function changeProd(){

    fs.createReadStream('./scripts/.env.prod').pipe(fs.createWriteStream('./.env'));
    console.info("Switched to production environment");

}

function showCurrent(){
    let data = fs.readFileSync('./.env', 'utf8');
    let line = data.split("\n")[0].substring(1);

    console.log('env: ', line);
}
