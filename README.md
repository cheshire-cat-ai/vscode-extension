# Cheshire Cat VS Code Extension

This is the Visual Studio Code extension to integrate the [Cheshire Cat](https://github.com/cheshire-cat-ai/core).

## Features

Currently, the extension has two features:
1. generating automatic comments on a portion of selected code,
2. generating a function starting from the name and a comment.

## Usage

### Comment code
To use it highlight some code → right-click → select `CheshireCat: Comment code`.  

> **Warning**
> Please, note that only OpenAI models can support the `CheshireCat: Comment code` functionalities for the moment.

### Make function

To use it highlight some code → right-click → select `CheshireCat: Make function`.

> **Warning**
> This extension relies on the Cheshire Cat and expect to find a running instance of it.

## Requirements

The extension requires to have the Cheshire Cat installed and running (instructions [here](https://cheshire-cat-ai.github.io/docs/technical/getting-started/)) with the Cat Code Commenter plugin enabled (instructions [here](https://github.com/nicola-corbellini/cat_code_commenter)).

## Extension Settings

> **Note**
> Many of the settings are the same you would write in the `.env` file of the Cheshire Cat.

This extension contributes the following settings:

- `CheshireCatAI.BaseUrl`: connection URL. Default to `localhost`.
- `CheshireCatAI.Port`: connection port. Default to `1865`.
- `CheshireCatAI.LanguageModel`: Language Model to use to comment the code. Default to `ChatGPT | gpt-3.5-turbo`.
- `CheshireCatAI.WebsocketPath`: Language Model to use to comment the code. Default to `ws`.
- `CheshireCatAI.ApiKey`: Personal API key from the Language Model vendor account.
- `CheshireCatAI.AuthKey`: Personal key to authenticate the Cheshire Cat endpoints. **(Optional)**

Once set your preferences, you can make them effective with `CTRL`+`Shift`+p → `Cheshire Cat AI: Restart Settings`.

### Currently available Language Models

By now, we only support `gpt-3.5-turbo`, `text-davinci-003` from OpenAI, `command` from Cohere and `starcoder` from HugginFace Hub. 

> Tip: for the smoothest experience, we recommend using ChatGPT.

## Contributing

If you have any suggestion, please feel free to open an issue or make a pull request!

* Test our extension
* Share it on social media
* Fork it and implement new features

## For more information

<a href="https://discord.gg/bHX5sNFCYU" target="blank">
    <img align="center" src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" alt="Link Discord" width="48" />
</a>

Thank you for your interest! 🙏 If you liked the project, please consider leaving a ⭐!

**Enjoy!**
