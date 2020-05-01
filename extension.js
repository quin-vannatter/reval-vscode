const vscode = require('vscode');
const https = require('https');
const http = require('http');

const COMMAND_PARENT = 'reval-vscode';
const CONFIG_NAME = 'revalVSCode';

function activate(context) {
	registerCommand(context, 'reload', () => makeRequest('reload'));
	registerCommand(context, 'clear', () => makeRequest('clear'));
	registerCommand(context, 'save', () => makeRequest('save'));
}

function makeRequest(action) {
	if(vscode.window.activeTextEditor) {

		const config = getConfig();
		
		const data = vscode.window.activeTextEditor.document.getText();
		const filePath = vscode.window.activeTextEditor.document.fileName;

		const hostname = config.hostname.trim();
		const port = config.port > 0 ? config.port : undefined;
		const endpoint = config.endpoint;

		const options = {
			hostname,
			port,
			path: `${endpoint}/reval/${action}?filePath=${filePath}`,
			method: action === 'reload' ? 'POST' : 'GET',
			headers: {
				'Content-Type': 'text/plain'
			}
		}

		const response = () => {
			let msg;
			switch(action) {
				case 'reload': 
					msg = 'Patch Applied';
					break;
				case 'clear':
					msg = 'Patch Cleared';
					break;
				case 'save':
					msg = 'Patch Saved';
					break;
			}
			vscode.window.showInformationMessage(fmtMsg(msg));
		}
		const req = config.useHttps ? https.request(options, response) : http.request(options, response);
		req.on('error', error => vscode.window.showErrorMessage(fmtMsg(error.message)));
		if(action === 'reload') {
			req.write(data);
		}
		req.end();
	}
}

function getConfig() {
	return vscode.workspace.getConfiguration(CONFIG_NAME, vscode.window.activeTextEditor.document.uri);
}

function registerCommand(context, name, func) {
	context.subscriptions.push(vscode.commands.registerCommand(`${COMMAND_PARENT}.${name}`, () => func()));
}

function fmtMsg(message) {
	return `${COMMAND_PARENT}: ${message}`;
}

module.exports = {
	activate
}
