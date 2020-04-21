const fs = require("fs");
const path = require("path");
const { cli } = require("cli-ux");
const chalk = require("chalk");
const { Octokit } = require("@octokit/rest");

// Oclif imports
import { Command, flags } from "@oclif/command";

export default class Login extends Command {
  static description = `Authenticates Spoon with GitHub account using a Personal Access Token`;
  static usage = `login [-t $GITHUB_TOKEN]`;

  static flags = {
    help: flags.help({ char: "h" }),
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
    let octokit = undefined;
    let user = undefined;

    if (accessToken) {
      octokit = new Octokit({ auth: accessToken });
      let { data } = await octokit.request("/user");
      user = data;
    }
    if (!flags.token || !user) {
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
          cli.action.start("Attempting to authenticate with GitHub");
          octokit = new Octokit({
            auth: accessToken,
          });
          let { data } = await octokit.request("/user");
          user = data;
          loginSuccess = true;
        } catch (e) {
          this.log("Invalid token, login unsuccessful");
          this.log("Please try again\n\n");
        }
        cli.action.stop(
          chalk.green(`${user.login} successfully authenticated`)
        );
      }
    }
    cli.action.start(`Writing token to: ${configFile}`);
    fs.writeFileSync(configFile, JSON.stringify({ accessToken }));
    cli.action.stop(chalk.green("done"));
  }
}
