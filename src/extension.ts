import { window, ExtensionContext, workspace, commands, Range } from 'vscode';
import { CatClient } from 'ccat-api';

const ModelConfig = [
	"ChatGPT | gpt-3.5-turbo",
	"GPT-3 | text-davinci-003",
	"Cohere | command",
	"HuggingFace Hub | starcoder"
] as const;

const AcceptedConfig = [
	"LLMOpenAIChatConfig",
	"LLMOpenAIConfig",
	"LLMCohereConfig",
	"LLMHuggingFaceHubConfig"
] as const;

const extId = "CheshireCatAI.cheshire-cat-ai";

const getModelConfig = (llm: string, apiKey: string) => {
	const modelsConfig = {
		"ChatGPT | gpt-3.5-turbo": {
			name: "LLMOpenAIChatConfig",
			requestBody: {
				"openai_api_key": apiKey,
				"model_name": "gpt-3.5-turbo"
			}
		},
		"GPT-3 | text-davinci-003": {
			name: "LLMOpenAIConfig",
			requestBody: {
				"openai_api_key": apiKey,
				"model_name": "text-davinci-003"
			}
		},
		"Cohere | command": {
			name: "LLMCohereConfig",
			requestBody: {
				"cohere_api_key": apiKey,
				"model": "command"
			}
		},
		"HuggingFace Hub | starcoder": {
			name: "LLMHuggingFaceHubConfig",
			requestBody: {
				"repo_id": "bigcode/starcoder",
				"huggingfacehub_api_token": apiKey
			}
		}
	}
	const model = llm as keyof typeof modelsConfig
	if (!ModelConfig.includes(model)) {
		return {
			name: "LLMDefaultConfig",
			requestBody: {}
		}
	} else {
		return modelsConfig[model]
	}
}

const getConfig = () => workspace.getConfiguration('CheshireCatAI')

export async function activate(context: ExtensionContext) {
	// Get extension configuration
	const ccatConfig = getConfig();
	let hasPlugin = false, isCompatible = true

	// Initialize Cat Client
	const cat = new CatClient({
		authKey: ccatConfig.AuthKey,
		baseUrl: ccatConfig.BaseUrl,
		port: ccatConfig.Port,
		ws: {
			path: ccatConfig.WebsocketPath,
			onFailed: (err) => {
				window.showErrorMessage(err.description);
			},
			retries: 3
		}
	}).onConnected(() => {
		window.showInformationMessage("The Cheshire Cat appeared!");
	}).onDisconnected(() => {
		window.showInformationMessage("The Cheshire Cat disappeared!");
	});

	const settings = await cat.api?.settingsLargeLanguageModel.getLlmSettings()
	const selected = settings?.settings.find(v => v.name === settings.selected_configuration)
	
	if (!selected || !AcceptedConfig.includes(selected.name as typeof AcceptedConfig[number])) {
		isCompatible = false
		window.showWarningMessage("Your LLM configuration is not supported!");
		commands.executeCommand('workbench.action.openSettings', `@ext:${extId}`);
	} else if (!ccatConfig.ApiKey) {
		commands.executeCommand('workbench.action.openWalkthrough', `${extId}#firstInstall`, true);
	}

	context.subscriptions.push(commands.registerCommand("cheshire-cat-ai.toSettings", () => {
		commands.executeCommand('workbench.action.openSettings', `@ext:${extId}`);
	}));

	context.subscriptions.push(commands.registerCommand("cheshire-cat-ai.refreshLLM", async () => {
		window.showWarningMessage("Updating LLM configuration...");
		const updatedConfig = getConfig();
		cat.reset()
		cat.init()
		if (!isCompatible) {
			let llmSetting = getModelConfig(updatedConfig.LanguageModel, updatedConfig.ApiKey);
			await cat.api?.settingsLargeLanguageModel.upsertLlmSetting(llmSetting.name, llmSetting.requestBody);
		}
		window.showInformationMessage("LLM configuration updated successfully!");
	}));

	context.subscriptions.push(commands.registerCommand("cheshire-cat-ai.fetchPlugins", async () => {
		const plugins = await cat.api?.plugins.listAvailablePlugins();
		hasPlugin = plugins?.installed.some(v => v.id === 'cat_code_commenter') ?? false;
		if (hasPlugin) {
			window.showInformationMessage("Plugin installed successfully!");
		} else {
			window.showErrorMessage("You didn't install the Code Commenter plugin correctly!");
		}
	}));

	context.subscriptions.push(commands.registerCommand("cheshire-cat-ai.commentCode", () => {
		if (!hasPlugin) {
			window.showErrorMessage("You didn't install the Code Commenter plugin!");
			return
		}

		const updatedConfig = getConfig();

		if (["HuggingFace Hub | starcoder", "Cohere | command"].includes(updatedConfig.LanguageModel)) {
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
				window.showErrorMessage("Automated commenting is only available with OpenAI models");
			} else {
				cat.send(highlighted, {
					use_declarative_memory: false,
					use_procedural_memory: false,
					use_episodic_memory: false,
					task: "comment"
				});
				
				cat.onMessage(data => {
					const json = JSON.parse(data.content);
					window.showInformationMessage(`Detected language: ${json.language}`);
					if (json.code) {
						editor.edit(editBuilder => {
							editBuilder.replace(selectionRange, json.code);
						});
					} else {
						window.showErrorMessage("The highlighted text may not be valid code. Try again please");
					}
				}).onError(() => {
					window.showErrorMessage("Something went wrong. Try again please");
				});
			}
		}
	}));

	context.subscriptions.push(commands.registerCommand("cheshire-cat-ai.makeFunction", () => {
		if (!hasPlugin) {
			window.showErrorMessage("You didn't install the Code Commenter plugin!");
			return
		}

		const updatedConfig = getConfig();

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
				const updatedConfig = getConfig();
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
		
	}));
}

export function deactivate() {}
