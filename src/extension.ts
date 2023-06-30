import vscode, { languages } from 'vscode';
import { CatClient } from 'ccat-api';

const ModelConfig = [
	"ChatGPT | gpt-3.5-turbo",
	"GPT-3 | text-davinci-003",
	"Cohere | command",
	"HuggingFace Hub | starcoder",
	"HuggingFace Hub | falcon-7b-instruct"
] as const;


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
				"repo_id": "falcon-7b-instruct",
				"huggingfacehub_api_token": apiKey
			};
			break;
		}
		case "HuggingFace Hub | starcoder": {
			name = "LLMHuggingFaceHubConfig";
			requestBody = {
				"repo_id": "starcoder",
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
	});

	const llmSetting = getModelConfig(ccatConfig.LanguageModel, ccatConfig.ApiKey);

	cat.api.settingsLargeLanguageModel.upsertLlmSetting(llmSetting.name, llmSetting.requestBody);

	vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('CheshireCat')) {
			cat.api.settingsLargeLanguageModel.upsertLlmSetting(llmSetting.name, llmSetting.requestBody);
			vscode.window.showWarningMessage("Updating LLM configuration...");
		}
    });

	// Open setup page on activation
	vscode.commands.executeCommand(`workbench.action.openWalkthrough`, `Cheshire-Cat-AI.cheshire-cat-ai#firstInstall`);

	// Command to open extension settings page
	let toSettings = vscode.commands.registerCommand("cheshire-cat-ai.toSettings", () => {
		vscode.commands.executeCommand('workbench.action.openSettings', '@ext:Cheshire-Cat-AI.cheshire-cat-ai');
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
				if (data.error) {
					if ((data as any).valid_code) {
						editor.edit(editBuilder => {
							editBuilder.replace(selectionRange, data.content);
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

	context.subscriptions.push(toSettings);
	context.subscriptions.push(commentCode);
}

export function deactivate() {}
