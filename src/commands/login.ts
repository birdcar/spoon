// Std library imports
const fs = require("fs");
const path = require("path");

// Oclif imports
import { Command, flags } from "@oclif/command";

// Third-party imports
const { cli } = require("cli-ux");
const chalk = require("chalk");
const { Octokit } = require("@octokit/rest");

export default class Login extends Command {
  static description = `Log in with your GitHub credentials`;
  static usage = `login`;

  static flags = {
    help: flags.help({ char: "h" }),
    // flag with a value (-n, --name=VALUE)
    token: flags.string({
      char: "t",
      description: `A GitHub Personal Access Token with at 'repo' & 'delete_repo' scopes`,
    }),
  };

  async run() {
    const { flags } = this.parse(Login);

    if (!fs.existsSync(this.config.configDir)) {
      fs.mkdirSync(this.config.configDir);
    }

    let configFile = path.join(this.config.configDir, "config.json");
    let accessToken = flags.token || undefined;
    let octokit = new Octokit({ auth: accessToken }) || undefined;

    if (!flags.token) {
      this.log(
        "Press any key and a web browser will open GitHub's 'New Token' page."
      );
      this.log(
        `Once you're there, Generate a GitHub Personal Access Token with both ${chalk.bold(
          "repo"
        )} & ${chalk.bold("delete_repo")} scopes.`
      );
      this.log(
        "Once that's been done, copy and paste the new token into the prompt below\n"
      );
      await cli.anykey();
      await cli.open("https://github.com/settings/tokens/new");
      let loginSuccess = false;

      while (!loginSuccess) {
        let accessToken = await cli.prompt("Paste token here");

        try {
          octokit = new Octokit({
            auth: accessToken,
          });
          loginSuccess = true;
        } catch (e) {
          this.log("Invalid token, login unsuccessful");
          this.log("Please try again\n\n");
        }
      }
    }

    fs.writeFileSync(configFile, JSON.stringify({ accessToken }));
    this.log(`Logged into GitHub successfully`);
  }
}
