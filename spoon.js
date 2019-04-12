/*
This script has been designed to use your provided GitHub API key and procedurally replace your forks with repos that you own. This provides you with all of your commit contributions that you may have missed out on. The creators of this are not responsible for any errors that you may make by altering the script. Please DO NOT use the drawer script until you are positive that your back-up forks and new repositories are made.

Thanks,
-Nick & Brandon
*/
require("dotenv").config();
const fs = require("fs");
const axios = require("axios");

const user = process.env.GHUSER; //YOUR GHUSERNAME.
const token = process.env.GHKEY; //YOUR API KEY HERE.

axios.interceptors.request.use(config => {
  config.headers.authorization = `bearer ${token}`;
  return config;
});

const main = async () => {
  const forkedRepos = await fetchRepos();
  const backup = await genBackup([forkedRepos[0]]);
  console.log("BACKUP", backup);
  const res = await renameForks([forkedRepos[0]]);
  console.log(res);
  const newRepos = await genRepos([forkedRepos[0]]);
  console.log(newRepos);
};

main();

//1. We grab a list of ALL of your current forked repos. If there are any that you do NOT want to defork, you will need to filter them manually after our initial filtering.
async function fetchRepos() {
  return new Promise(async (resolve, reject) => {
    try {
      //TODO Deal with > 100 repos.
      const { data: repos } = await axios.get(
        `https://api.github.com/users/${user}/repos?per_page=100`
      );
      const filteredRepos = repos.reduce((arr, repo) => {
        if (repo.fork) {
          arr.push({
            owner: repo.owner.login,
            name: repo.name,
            full_name: repo.full_name,
            clone_url: repo.clone_url,
            forked: repo.fork,
            description: repo.description
          });
        }
        return arr;
      }, []);
      resolve(filteredRepos);
    } catch (error) {
      console.error("ERROR", error);
      reject(error);
    }
  });
}

//2. We generate a list of all of the forked repos with appended names to include -bak.
function genBackup(arr) {
  const backups = arr.map(repo => ({
    ...repo,
    name: repo.name + "-bak",
    full_name: repo.full_name + "-bak"
  }));
  fs.writeFileSync("./backups.json", JSON.stringify(backups));
  return backups;
}

//3. We rename the current forked repos on GitHub.
async function renameForks(repos) {
  return new Promise(async (resolve, reject) => {
    try {
      repos.forEach(async repo => {
        try {
          await axios.patch(`https://api.github.com/repos/${repo.full_name}`, {
            name: repo.name + "-bak"
          });
        } catch (error) {
          console.error("RENAME FORK ERROR", error);
        }
      });
      resolve("Fork renaming complete");
    } catch (error) {
      reject(error);
    }
  });
}

//4. We generate all new repos using the array of forked repo names.
//https://developer.github.com/v3/repos/#create
async function genRepos(repos) {
  return new Promise(async (resolve, reject) => {
    try {
      repos.forEach(async repo => {
        try {
          await axios.post(`https://api.github.com/user/repos`, {
            name: repo.name,
            description: repo.description
          });
        } catch (error) {
          console.log("REPO CREATION ERROR", error);
        }
      });
      resolve("New repo creation complete");
    } catch (error) {
      console.log("REPO CREATION ERROR", error);
    }
  });
}

//5. We make a request to the GitHub import endpoint for each repo using the information from our -bak ammended array.

//6. You should now have all new repos with the original names AND all of your -bak repos that are still forked. Please proceed to drawer.js ONLY if this is true.
