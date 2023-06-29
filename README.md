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

The extension requires to have the Cheshire Cat installed and running (instructions [here](https://cheshire-cat-ai.github.io/docs/technical/getting-started/)) with the Cat Code Commenter plugin enabled (instructions [here]()).

## Extension Settings

This extension contributes the following settings:

* `CheshireCat.BaseUrl`: connection URL. Default to `localhost`.
* `CheshireCat.Port`: connection port. Default to `1865`.
* `CheshireCat.ConfigureLanguageModel`: Language Model to use to comment the code.
* `CheshireCat.ApiKey`: Personal API key from the Language Model vendor account.

> **Note**
> Many of the settings are the same you would write in the `.env` file of the Cheshire Cat.

## Known Issues


## Release Notes


### 0.0.1

Basic code commenting.

## Roadmap


# Contributing

If you have any suggestion, please feel free to open an issue or make a pull request!

## For more information

![Discord]({https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white})

Thank you for your interest! 🙏 If you liked the project, please consider leaving a ⭐
!

**Enjoy!**
