import { window, ExtensionContext, workspace, commands, Range } from 'vscode';
import { CatClient } from 'ccat-api';

const AcceptedConfig = [
	"LLMOpenAIChatConfig",
	"LLMOpenAIConfig",
	"LLMCohereConfig",
	"LLMHuggingFaceHubConfig",
	"LLMAzureOpenAIConfig",
	"LLMAzureChatOpenAIConfig"
] as const;

const AcceptedModels = [
	"gpt",
	"command",
	"text-davinci-003",
	"bigcode/starcoder"
] as const; 

const extId = "CheshireCatAI.cheshire-cat-ai";

const getConfig = () => workspace.getConfiguration('CheshireCatAI')

const generateClient = (instant = true) => {
	// Get extension configuration
	const ccatConfig = getConfig();
	// Initialize Cat Client
	return new CatClient({
		authKey: ccatConfig.AuthKey,
		baseUrl: ccatConfig.BaseUrl,
		port: ccatConfig.Port,
		secure: ccatConfig.Secure,
		instant,
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
	}).onError(err => {
		window.showErrorMessage(err.description);
	});
}

export async function activate(context: ExtensionContext) {
	// Initialize Cat Client
	let cat = generateClient()

	let isCompatible = true
	
	const checkPlugin = async () => {
		const plugins = await cat.api?.plugins.listAvailablePlugins();
		return plugins?.installed.some(v => v.id.startsWith('cat_code_commenter')) ?? false;
	}
	
	const checkLLM = async () => {
		const settings = await cat.api?.largeLanguageModel.getLlmsSettings();
		const selected = settings?.settings.find(v => v.name === settings.selected_configuration)
		const modelName = (selected?.value['model'] || selected?.value['model_name'] || selected?.value['repo_id']) as string | undefined;
		if (!selected || !AcceptedConfig.includes(selected.name as typeof AcceptedConfig[number])
			|| !AcceptedModels.some(v => modelName?.startsWith(v))) {
			isCompatible = false
			window.showWarningMessage("Your LLM configuration is not supported! Please, update your Cat's settings");
		}
		return {
			config: selected?.name ?? "",
			model: modelName ?? ""
		};
	}
	
	let hasPlugin = await checkPlugin(), currentLLM = await checkLLM();

	if (!hasPlugin) {
		commands.executeCommand('workbench.action.openWalkthrough', `${extId}#firstInstall`, true);
	}

	context.subscriptions.push(commands.registerCommand("cheshire-cat-ai.toSettings", () => {
		commands.executeCommand('workbench.action.openSettings', `@ext:${extId}`);
	}));

	context.subscriptions.push(commands.registerCommand("cheshire-cat-ai.refreshConnection", () => {
		cat = generateClient(false)
		cat.reset()
		cat.init()
	}));

	context.subscriptions.push(commands.registerCommand("cheshire-cat-ai.fetchPlugins", async () => {
		hasPlugin = await checkPlugin();
		if (hasPlugin) {
			window.showInformationMessage("Plugin installed successfully!");
		} else {
			window.showErrorMessage("You didn't install the Code Commenter plugin correctly!");
		}
	}));

	context.subscriptions.push(commands.registerCommand("cheshire-cat-ai.fetchLLM", async () => {
		currentLLM = await checkLLM();
		if (isCompatible) {
			window.showInformationMessage("Your current LLM is compatible!");
		}
	}));

	context.subscriptions.push(commands.registerCommand("cheshire-cat-ai.commentCode", () => {
		if (!hasPlugin) {
			window.showErrorMessage("You didn't install the Code Commenter plugin!");
			commands.executeCommand('workbench.action.openWalkthrough', `${extId}#firstInstall`, true);
			return
		}

		if (["LLMHuggingFaceHubConfig", "LLMCohereConfig"].includes(currentLLM.config) || !isCompatible) {
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
	}));

	context.subscriptions.push(commands.registerCommand("cheshire-cat-ai.makeFunction", () => {
		if (!hasPlugin) {
			window.showErrorMessage("You didn't install the Code Commenter plugin!");
			commands.executeCommand('workbench.action.openWalkthrough', `${extId}#firstInstall`, true);
			return
		}

		if ([""].includes(currentLLM.config) || !isCompatible) {
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
			});
			
			cat.onMessage(data => {
					editor.edit(editBuilder => {
						const createdFunction = `${highlighted}\n${data.content}`
						editBuilder.replace(selectionRange, createdFunction);
					})
			}).onError(() => {
				window.showErrorMessage("Something went wrong. Please try again.");
			});
		}
		
	}));
}

export function deactivate() {}
