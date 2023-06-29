import vscode from 'vscode';
import { CatClient } from 'ccat-api';

export function activate(context: vscode.ExtensionContext) {
	// Get extension configuration
	const ccatConfig = vscode.workspace.getConfiguration('CheshireCat');

	// Initialize Cat Client
	const cat = new CatClient({
		baseUrl: ccatConfig.BaseUrl,
		port: ccatConfig.Port,
		ws: {
			onFailed: (err) => {
				vscode.window.showErrorMessage(`Error Code: ${err}`);
			},
			retries: 3
		}
	});

	vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('CheshireCat')) {
			//cat.api.settingsLargeLanguageModel.upsertLlmSetting()
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
				console.log(data.content);
				editor.edit(editBuilder => {
					editBuilder.replace(selectionRange, data.content);
				});
			});
		}
	});

	context.subscriptions.push(toSettings);
	context.subscriptions.push(commentCode);
}

export function deactivate() {}
