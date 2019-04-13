/*
Welcome to the drawer.
Please DO NOT run this script if you have not confirmed all of your repos were successfully created and imported. 
This script delete ALL of the repositories we marked as forked that are found in the backups.json file.
If you do NOT want a repository deleted, please remove the object from backups.json.
This is NOT reversible.
*/
require("dotenv").config();
const bluebird = require("bluebird");
const axios = require("axios");
const bakRepos = require("./backups.json");

const token = process.env.GHKEY; //YOUR API KEY HERE.

axios.interceptors.request.use(config => {
  config.headers.authorization = `bearer ${token}`;
  return config;
});

function main(repos) {
  console.log("Starting to delete -bak repos...");
  bluebird
    .each(repos, repo => {
      return axios.delete(`https://api.github.com/repos/${repo.full_name}`);
    })
    .then(() => {
      console.log("All -bak repos have been successfully deleted.");
    })
    .catch(error => {
      console.log("Something went wrong in the -bak deletion.", error);
    });
}

main(bakRepos);
