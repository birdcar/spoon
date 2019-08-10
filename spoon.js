/*
This script has been designed to use your provided GitHub API key and procedurally replace your forks with repos that you own.
This provides you with all of your commit contributions that you may have missed out on.
The creators of this are not responsible for any errors that you may make by altering the script.
Please DO NOT use the drawer script until you are positive that your back-up forks and new repositories are made.

Thanks,
-Nick & Brandon
*/
require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const bluebird = require("bluebird");

const token = process.env.GHKEY; // YOUR API KEY HERE.
const user = "fake-user"; // YOUR GITHUB HANDLE HERE

axios.interceptors.request.use(config => {
  config.headers.authorization = `bearer ${token}`;
  config.headers.accept = "application/vnd.github.barred-rock-preview";
  return config;
});

const main = async () => {
  console.log("Fetching forked repos...");
  const forkedRepos = await fetchRepos();
  console.log("Fetch complete.");
  console.log(
    `You have ${
    forkedRepos.length
    } forked repositories. Please search -bak after the operation and confirm the number of repos with -bak in the name.`
  );
  if (forkedRepos.length === 0) {
    console.log('You currently have no forked repos, here\'s a pony!')
    return null
  } else {
    console.log("Creating backup...");
    await genBackup(forkedRepos);
    console.log("Backup complete.");
    console.log("Renaming existing forks...");
    await renameForks(forkedRepos);
    console.log("Renaming complete.");
    console.log("Generating new repos...");
    await genRepos(forkedRepos);
    console.log("New repos complete.");
    console.log("Importing data from forks to new repos...");
    await importData(forkedRepos);
    console.log("Import complete!");
  }
};

main();

//1. We grab a list of ALL of your current forked repos. If there are any that you do NOT want to defork, you will need to filter them manually after our initial filtering.
function fetchRepos() {
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
function renameForks(repos) {
  return new Promise(async (resolve, reject) => {
    bluebird
      .each(repos, repo => {
        return axios.patch(`https://api.github.com/repos/${repo.full_name}`, {
          name: repo.name + "-bak"
        });
      })
      .then(() => {
        resolve();
      })
      .catch(error => {
        console.log("FORK RENAMING ERROR", error);
        reject(error);
      });
  });
}

//4. We generate all new repos using the array of forked repo names.
//TODO Trial run with bluebird, maybe add a timeout after each iteration for safety?
function genRepos(repos) {
  return new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        bluebird
          .each(repos, repo => {
            return axios.post(`https://api.github.com/user/repos`, {
              name: repo.name,
              description: repo.description
            });
          })
          .then(() => {
            resolve();
          });
      }, 500);
    } catch (error) {
      console.log("REPO CREATION ERROR", error);
      reject();
    }
  });
}

//5. We make a request to the GitHub import endpoint for each repo using the information from our -bak ammended array. This could take a while.
//TODO Figure out how to handle import error "Import already in progress"
function importData(repos) {
  return new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        bluebird
          .each(repos, repo => {
            return axios.put(
              `https://api.github.com/repos/${repo.owner}/${repo.name}/import`,
              {
                vcs_url: `https://github.com/${repo.full_name}-bak.git`,
                vcs: "git"
              }
            );
          })
          .then(() => {
            resolve();
          })
          .catch(error => {
            console.log("IMPORT ERROR", error);
            reject();
          });
      }, 5000);
    } catch (error) {
      console.log("IMPORT ERROR", error);
      reject();
    }
  });
}

//6. You should now have all new repos with the original names AND all of your -bak repos that are still forked. Please proceed to drawer.js ONLY if this is true.

//Old import repo code. Bluebird IS tested and GOOD.
// repos.forEach(async repo => {
//     try {
//       const res = await axios.put(
//         `https://api.github.com/repos/${repo.owner}/${repo.name}/import`,
//         {
//           vcs_url: `https://github.com/${repo.full_name}-bak.git`,
//           vcs: "git"
//         }
//       );
//       console.log(res);
//     } catch (error) {
//       console.log("IMPORT ERROR", error);
//       reject();
//     }
//   });

// Old generate new repo code. Bluebird function NOT tested yet
// repos.forEach(async repo => {
//     try {
//       await axios.post(`https://api.github.com/user/repos`, {
//         name: repo.name,
//         description: repo.description
//       });
//       await new Promise(resolve => {
//         setTimeout(resolve, 500);
//       });
//     } catch (error) {
//       console.log("REPO CREATION ERROR", error);
//       reject();
//     }
//   });

// Rename forks old code. Bluebird function NOT tested yet
// repos.forEach(async repo => {
//   try {
//     await axios.patch(`https://api.github.com/repos/${repo.full_name}`, {
//       name: repo.name + "-bak"
//     });
//   } catch (error) {
//     console.error("RENAME FORK ERROR", error);
//   }
// });
// resolve("Fork renaming complete");
