import vscode, { languages } from 'vscode';
import { CatClient } from 'ccat-api';

const ModelConfig = [
	"ChatGPT | gpt-3.5-turbo",
	"GPT-3 | text-davinci-003",
	"Cohere | command",
	"HuggingFace Hub | falcon-7b-instruct"
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
		case "HuggingFace Hub | falcon-7b-instruct": {
			name = "LLMHuggingFaceHubConfig";
			requestBody = {
				"repo_id": "tiiuae/falcon-7b-instruct",
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

export function activate(context: vscode.ExtensionContext) {
	// Get extension configuration
	const ccatConfig = vscode.workspace.getConfiguration('CheshireCatAI');

	// Initialize Cat Client
	const cat = new CatClient({
		authKey: ccatConfig.AuthKey,
		baseUrl: ccatConfig.BaseUrl,
		port: ccatConfig.Port,
		ws: {
			path: ccatConfig.WebsocketPath,
			onFailed: (err) => {
				vscode.window.showErrorMessage(`Error Code: ${err}`);
			},
			retries: 3
		}
	}).onConnected(() => {
		vscode.window.showInformationMessage("The Cheshire Cat appeared!");
	});

	cat.onDisconnected(() => {
		vscode.window.showInformationMessage("The Cheshire Cat disappeared!");
	});

	let llmSetting = getModelConfig(ccatConfig.LanguageModel, ccatConfig.ApiKey);

	cat.api.settingsLargeLanguageModel.upsertLlmSetting(llmSetting.name, llmSetting.requestBody);
	
	vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('CheshireCatAI')) {
			llmSetting = getModelConfig(ccatConfig.LanguageModel, ccatConfig.ApiKey);
			cat.api.settingsLargeLanguageModel.upsertLlmSetting(llmSetting.name, llmSetting.requestBody);
			vscode.window.showWarningMessage("Updating LLM configuration...");
		}
    });		

	// Open setup page on activation
	vscode.commands.executeCommand(`workbench.action.openWalkthrough`, `${extId}#firstInstall`);

	// Command to open extension settings page
	let toSettings = vscode.commands.registerCommand("cheshire-cat-ai.toSettings", () => {
		vscode.commands.executeCommand('workbench.action.openSettings', `@ext:${extId}`);
	});

	let restartSettings = vscode.commands.registerCommand("cheshire-cat-ai.restartSettings", async () => {
		vscode.window.showWarningMessage("Updating LLM configuration...");
		console.log(llmSetting, ccatConfig)
		await cat.api.settingsLargeLanguageModel.upsertLlmSetting(llmSetting.name, llmSetting.requestBody);
		vscode.window.showInformationMessage("LLM configuration updated successfully!");
	});

	let fetchPlugins = vscode.commands.registerCommand("cheshire-cat-ai.fetchPlugins", async () => {
		const plugins = await cat.api.plugins.listAvailablePlugins();
		const hasPlugin = plugins.installed.some(v => v.id === 'cat_code_commenter');
		if (hasPlugin) {
			vscode.window.showInformationMessage("Plugin installed successfully!");
		} else {
			vscode.window.showErrorMessage("You didn't install the Cheshire Cat plugin correctly!");
		}
	});

	// Command to comment the code
	let commentCode = vscode.commands.registerCommand("cheshire-cat-ai.commentCode", () => {
		const editor = vscode.window.activeTextEditor;
		const selection = editor?.selection;

		if (selection && !selection.isEmpty) {
			// Get text selection
			const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
			const highlighted = editor.document.getText(selectionRange);

			cat.send(highlighted, {
				use_declarative_memory: false,
				use_procedural_memory: false,
				use_episodic_memory: false
			});
			
			cat.onMessage(data => {
				if (!data.error) {
					const json = JSON.parse(data.content);
					vscode.window.showInformationMessage(`Detected language: ${json.language}`);
					if (json["code"]) {
						editor.edit(editBuilder => {
							editBuilder.replace(selectionRange, json.code);
						});
					} else {
						vscode.window.showErrorMessage("The highlighted text may not be valid code. Try again please");
					}
				} else {
					vscode.window.showErrorMessage("Something went wrong. Try again please");
				}
			});
		}
	});

	context.subscriptions.push(restartSettings);
	context.subscriptions.push(toSettings);
	context.subscriptions.push(commentCode);
	context.subscriptions.push(fetchPlugins);
}

export function deactivate() {}
