import { access } from "fs";

const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const { Octokit } = require("@octokit/rest");

const hook = async function (opts: { configDir: string }) {
  const configPath = path.join(opts.configDir, "config.json");

  if (!fs.existsSync(configPath)) {
    console.log(
      `You must first authenticate spoon using '${chalk.bold("spoon login")}'`
    );
    return;
  }

  const { accessToken } = JSON.parse(fs.readFileSync(configPath));
  const octokit = new Octokit({ auth: accessToken });

  try {
    await octokit.request("/user");
  } catch (e) {
    console.log(
      `There's a problem with your Personal access token, please reauthenticate with '${chalk.bold(
        "spoon login"
      )}'`
    );
  }

  return accessToken;
};

export default hook;
