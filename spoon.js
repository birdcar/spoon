/*
***NOTE: This script has only been tested on cases where the total number of
forked repos is < 100 forks. If you are attempting to run this script on more
than 100 forks, please be aware that we, the creators, are not responsible for
any errors that result from altering this script.

(i)   This script has been designed to use your provided GitHub API key & your
GitHub handle to procedurally replace each of your forked repositories with
fresh copies of those repos that you will personally own.

(ii)  Running this script will update your GitHub contribution calendar,
retroactively giving you credit for any and all commits that were previously
made to these forked repos. If all of the following are true regarding those 
old commits, you will finally receive the credit you deserve for them:

    (a) The email address used for the commits is associated with your GitHub
        account (i.e. - verify that the email address you have set up for git 
        on your local machine is the same as the email address you have set up 
        on your GitHub account).
        
    (b) The previous commits you made were on the default branch (usually 
        'master' branch) of the forked repo. If they are on a different branch,
        please open up a new pull request and make sure to merge them into 
        'master' before running this script! ***YOU HAVE BEEN WARNED!

(iii) The creators of this script are NOT responsible for any errors that you 
      may produce by altering the script.

(iv)  Please do NOT proceed with running the 'drawer.js' script until you are 
      100% POSITIVE that your back-up forks and new repositories have been 
      created successfully.

Thanks,
-Nick & Brandon

P.S. -  Not to sound like a 'broken record', but it would be a REALLY good idea 
        to make sure that any unmerged PRs in your forked repos are merged 
        _BEFORE_ running this script!
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
	if (user === "fake-user") {
		console.log(
			"\nPlease make sure to replace the value for the const 'user' variable ('fake-user') with your own GitHub handle and try again."
		);
	} else {
		console.log("\nFetching forked repos...");
		const forkedRepos = await fetchRepos();
		console.log("\nFetch complete.");
		console.log(
			`\nNumber of Forked Repos to 'Unfork': ${forkedRepos.length}\n\nIf you feel that this number is incorrect, please check the following before running the script again:\n---(a) take care of any unmerged PRs in your forked repos!\n---(b) verify that the GitHub API key you are using is correct.`
		);
		if (forkedRepos.length === 0) {
			console.log("\nYou currently have no forked repos, here's a pony!");
			return null;
		} else {
			console.log("\nCreating backups...");
			await genBackup(forkedRepos);
			console.log("Backups complete.");
			console.log("Renaming existing forks...");
			await renameForks(forkedRepos);
			console.log("Renaming complete.");
			console.log("Generating new repos...");
			await genRepos(forkedRepos);
			console.log("New repos complete.");
			console.log("Importing data from forks to new repos...");
			await importData(forkedRepos);
			console.log("Import complete.");
			console.log(
				`\nTo confirm that this script correctly duplicated all of your forked repos properly, please search your repositories list for all repos with '-bak' added to the ends of their names.`
			);
		}
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
				if (
					repo.fork === true &&
					repo.name !== "spoon" &&
					repo.open_issues_count === 0
				) {
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
