import { window, ExtensionContext, workspace, commands, Range } from 'vscode';
import { CatClient } from 'ccat-api';

const ModelConfig = [
	"ChatGPT | gpt-3.5-turbo",
	"GPT-3 | text-davinci-003",
	"Cohere | command",
	"HuggingFace Hub | starcoder"
] as const;

const extId = "Cheshire-Cat-AI.cheshire-cat-ai";

function getModelConfig(llm: string, apiKey: string) {
	let name = "", requestBody = {};
	switch (llm as typeof ModelConfig[number]) {
		case "ChatGPT | gpt-3.5-turbo": {
			name = "LLMOpenAIChatConfig";
			requestBody = {
				"openai_api_key": apiKey,
				"model_name": "gpt-3.5-turbo"
			};
			break;
		}
		case "GPT-3 | text-davinci-003": {
			name = "LLMOpenAIConfig";
			requestBody = {
				"openai_api_key": apiKey,
				"model_name": "text-davinci-003"
			};
			break;
		}
		case "Cohere | command": {
			name = "LLMCohereConfig";
			requestBody = {
				"cohere_api_key": apiKey,
				"model": "command"
			};
			break;
		}
		case "HuggingFace Hub | starcoder": {
			name = "LLMHuggingFaceHubConfig";
			requestBody = {
				"repo_id": "bigcode/starcoder",
				"huggingfacehub_api_token": apiKey
			};
			break;
		}
		default:
			name = "LLMDefaultConfig";
			requestBody = {};
	}
	return {
		name, 
		requestBody
	};
}

export function activate(context: ExtensionContext) {
	// Get extension configuration
	const ccatConfig = workspace.getConfiguration('CheshireCatAI');

	// Initialize Cat Client
	const cat = new CatClient({
		authKey: ccatConfig.AuthKey,
		baseUrl: ccatConfig.BaseUrl,
		port: ccatConfig.Port,
		ws: {
			path: ccatConfig.WebsocketPath,
			onFailed: (err) => {
				window.showErrorMessage(`Error Code: ${err}`);
			},
			retries: 3
		}
	}).onConnected(() => {
		window.showInformationMessage("The Cheshire Cat appeared!");
	}).onDisconnected(() => {
		window.showInformationMessage("The Cheshire Cat disappeared!");
	});

	// Open setup page on activation
	commands.executeCommand(`workbench.action.openWalkthrough`, `${extId}#firstInstall`);

	// Command to open extension settings page
	const toSettings = commands.registerCommand("cheshire-cat-ai.toSettings", () => {
		commands.executeCommand('workbench.action.openSettings', `@ext:${extId}`);
	});

	const restartSettings = commands.registerCommand("cheshire-cat-ai.restartSettings", async () => {
		window.showWarningMessage("Updating LLM configuration...");
		const updatedConfig = workspace.getConfiguration('CheshireCatAI');
		let llmSetting = getModelConfig(updatedConfig.LanguageModel, updatedConfig.ApiKey);
		await cat.api?.settingsLargeLanguageModel.upsertLlmSetting(llmSetting.name, llmSetting.requestBody);
		window.showInformationMessage("LLM configuration updated successfully!");
	});

	const fetchPlugins = commands.registerCommand("cheshire-cat-ai.fetchPlugins", async () => {
		const plugins = await cat.api?.plugins.listAvailablePlugins();
		const hasPlugin = plugins?.installed.some(v => v.id === 'cat_code_commenter');
		if (hasPlugin) {
			window.showInformationMessage("Plugin installed successfully!");
		} else {
			window.showErrorMessage("You didn't install the Cheshire Cat plugin correctly!");
		}
	});

	// Command to comment the code
	const commentCode = commands.registerCommand("cheshire-cat-ai.commentCode", () => {
		const updatedConfig = workspace.getConfiguration('CheshireCatAI');

		if (["HuggingFace Hub | starcoder"].includes(updatedConfig.LanguageModel)) {
			window.showErrorMessage("This LLM does not support this command");
			return
		}
		
		const editor = window.activeTextEditor;
		const selection = editor?.selection;
		
		if (selection && !selection.isEmpty) {
			// Get text selection
			const selectionRange = new Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
			const highlighted = editor.document.getText(selectionRange);
			if (ModelConfig.includes(updatedConfig.LanguageModel, 3)) {
				window.showErrorMessage("Automated commenting is only available with OpenAI or Cohere models");
			} else {
				cat.send(highlighted, {
					use_declarative_memory: false,
					use_procedural_memory: false,
					use_episodic_memory: false,
					task: "comment"
				});
				
				cat.onMessage(data => {
					if (data.content.startsWith("```")) {
						let lines = data.content.split("\n")
						lines.splice(0, 1)
						lines.splice(lines.length - 1, 1)
						let formattedAnswer = lines.join("\n")
						const json = JSON.parse(formattedAnswer);
					} else {
						const json = JSON.parse(data.content);
						window.showInformationMessage(`Detected language: ${json.language}`);
						if (json["code"]) {
							editor.edit(editBuilder => {
								editBuilder.replace(selectionRange, json.code);
							});
						} else {
							window.showErrorMessage("The highlighted text may not be valid code. Try again please");
						}
					}
				}).onError(() => {
					window.showErrorMessage("Something went wrong. Try again please");
				});
			}
		}
	});


	const makeFunction = commands.registerCommand("cheshire-cat-ai.makeFunction", () => {
		const updatedConfig = workspace.getConfiguration('CheshireCatAI');

		if ([""].includes(updatedConfig.LanguageModel)) {
			window.showErrorMessage("This LLM does not support this command");
			return
		}
		
		const editor = window.activeTextEditor;
		const selection = editor?.selection;

		if (selection && !selection.isEmpty) {
			// Get text selection
			const selectionRange = new Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
			const highlighted = editor.document.getText(selectionRange);

			cat.send(highlighted, {
				use_declarative_memory: false,
				use_procedural_memory: false,
				use_episodic_memory: false,
				task: "function"
			} as any);
			
			cat.onMessage(data => {
				const updatedConfig = workspace.getConfiguration('CheshireCatAI');
				if (ModelConfig.includes(updatedConfig.LanguageModel, 2)) {
					editor.edit(editBuilder => {
						const createdFunction = `${highlighted}\n${data.content}`
						editBuilder.replace(selectionRange, createdFunction);
					});
				}
				else {
					editor.edit(editBuilder => {
						editBuilder.replace(selectionRange, data.content);
					});
				}
			}).onError(() => {
				window.showErrorMessage("Something went wrong. Try again please");
			});
		}
		
	});

	context.subscriptions.push(restartSettings);
	context.subscriptions.push(toSettings);
	context.subscriptions.push(commentCode);
	context.subscriptions.push(fetchPlugins);
	context.subscriptions.push(makeFunction);
}

export function deactivate() {}
