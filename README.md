# Cheshire Cat VS Code Extension

This is the Visual Studio Code extension to integrate the [Cheshire Cat](https://github.com/cheshire-cat-ai/core).

## Features

Currently, the extension allows generating automatic comments on a portion of selected code. Other features are on [their way](#roadmap).

## Usage

To use it select some code → right-click → select `CheshireCat: Comment code`.

> **Warning**
> This extension relies on the Cheshire Cat and expect to find a running instance of it.

> Tip: for the smoothest experience, we recommend using ChatGPT.

## Requirements

The extension requires to have the Cheshire Cat installed and running (instructions [here](https://cheshire-cat-ai.github.io/docs/technical/getting-started/)) with the Cat Code Commenter plugin enabled (instructions [here](https://github.com/nicola-corbellini/cat_code_commenter)).

## Extension Settings

This extension contributes the following settings:

* `CheshireCatAI.BaseUrl`: connection URL. Default to `localhost`.
* `CheshireCatAI.Port`: connection port. Default to `1865`.
* `CheshireCatAI.LanguageModel`: Language Model to use to comment the code.
* `CheshireCatAI.ApiKey`: Personal API key from the Language Model vendor account.

> **Note**
> Many of the settings are the same you would write in the `.env` file of the Cheshire Cat.

# Contributing

If you have any suggestion, please feel free to open an issue or make a pull request!

* Test our extension
* Share it on social media
* Fork it and implement new features

## For more information

<p>
<a href="https://discord.gg/bHX5sNFCYU" target="blank"><img align="center" src="https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/discord.svg" alt="Link Discord" width="80" /></a>
</p>

Thank you for your interest! 🙏 If you liked the project, please consider leaving a ⭐
!

**Enjoy!**
