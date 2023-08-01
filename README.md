# Cheshire Cat VS Code Extension

This is the Visual Studio Code extension to integrate the [Cheshire Cat](https://github.com/cheshire-cat-ai/core).

## Features

Currently, the extension has two features:

1. Generating automatic comments on a portion of selected code,
2. Generating a function starting from the name and a comment.

## Requirements

The extension requires to have the Cheshire Cat installed and running (instructions [here](https://cheshire-cat-ai.github.io/docs/technical/getting-started/)) with the Cat Code Commenter plugin enabled (instructions [here](https://github.com/nicola-corbellini/cat_code_commenter)).

> **Warning**
> This extension relies on the Cheshire Cat and expect to find a running instance of it. Please, remember to set a language model in the "Settings" page with the `admin` in the browser.

## Usage

### Comment code

To use it highlight some code → right-click → select `CheshireCat: Comment code`.  

> **Warning**
> Please, note that only OpenAI models can support the `CheshireCat: Comment code` functionalities for the moment.

### Make function

To use it highlight some code → right-click → select `Cheshire Cat AI: Function From Comment`.

### Other commands

- `Cheshire Cat AI: Refresh WebSocket Connection`: allows refreshing the websocket connection with the Cat. This can be useful if, for any reason, VSCode loses the connection with the Cat.
- `Cheshire Cat: Fetch Language Model`: allows updating the language model settings and check if the set model is compatible.

### Change of LLM 

> **Note**
> Please, rembemder to call `Cheshire Cat: Fetch Language Model`, when you change the language model in the Cat.

## Extension Settings

> **Note**
> Many of the settings are the same you would write in the `.env` file of the Cheshire Cat.

This extension contributes the following settings:

- `CheshireCatAI.BaseUrl`: connection URL. Default to `localhost`.
- `CheshireCatAI.Port`: connection port. Default to `1865`.
- `CheshireCatAI.WebsocketPath`: Language Model to use to comment the code. Default to `ws`.
- `CheshireCatAI.Secure`: Set a secure connection for websocket and endpoints. Default to `false`.
- `CheshireCatAI.AuthKey`: Personal key to authenticate the Cheshire Cat endpoints. **(Optional)**

The extension automatically reads the language model settings from the Cat.
Please, make sure your instance of the Cat is set on a [supported](#currently-available-language-models) language model, otherwise configure one in the "Settings" page.

### Currently available Language Models

By now, we only support `text-davinci-003` and any `gpt` model from [OpenAI](https://platform.openai.com/docs/models/) and AzureOpenAI, `command` from [Cohere](https://docs.cohere.com/docs/models) and `bigcode/starcoder` from [HugginFace Hub](https://huggingface.co/bigcode/starcoder).

> Tip: for the smoothest experience, we recommend using ChatGPT.

## Contributing

If you have any suggestion, please feel free to open an issue or make a pull request!

- Test our extension
- Share it on social media
- Fork it and implement new features

## For more information

<a href="https://discord.gg/bHX5sNFCYU" target="blank">
    <img align="center" src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" alt="Link Discord" width="48" />
</a>

Thank you for your interest! 🙏 If you liked the project, please consider leaving a ⭐!

**Enjoy!**
