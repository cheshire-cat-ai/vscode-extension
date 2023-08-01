import { window, ExtensionContext, workspace, commands, Range } from 'vscode';
import { CatClient } from 'ccat-api';

const AcceptedConfig = [
	"LLMOpenAIChatConfig",
	"LLMOpenAIConfig",
	"LLMCohereConfig",
	"LLMHuggingFaceHubConfig",
	"LLMAzureOpenAIConfig",
	"LLMAzureOpenAIChatConfig"
] as const;

const extId = "CheshireCatAI.cheshire-cat-ai";

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
		secure: ccatConfig.Secure,
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
	const plugins = await cat.api?.plugins.listAvailablePlugins();
	hasPlugin = plugins?.installed.some(v => v.id === 'cat_code_commenter') ?? false;
	
	if (!selected || !AcceptedConfig.includes(selected.name as typeof AcceptedConfig[number])) {
		isCompatible = false
		window.showWarningMessage("Your LLM configuration is not supported! Please, update your cat's settings");
	}

	if (!hasPlugin) {
		commands.executeCommand('workbench.action.openWalkthrough', `${extId}#firstInstall`, true);
	}

	context.subscriptions.push(commands.registerCommand("cheshire-cat-ai.toSettings", () => {
		commands.executeCommand('workbench.action.openSettings', `@ext:${extId}`);
	}));

	context.subscriptions.push(commands.registerCommand("cheshire-cat-ai.refreshConnection", () => {
		cat.reset()
		cat.init()
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
			commands.executeCommand('workbench.action.openWalkthrough', `${extId}#firstInstall`, true);
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
			});
			
			cat.onMessage(data => {
				editor.edit(editBuilder => {
					editBuilder.replace(selectionRange, data.content);
				});
			}).onError(() => {
				window.showErrorMessage("Something went wrong. Try again please");
			});
		}
		
	}));
}

export function deactivate() {}
