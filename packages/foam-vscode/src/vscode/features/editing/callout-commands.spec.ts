/* @unit-ready */
import * as vscode from 'vscode';
import {
  cleanWorkspace,
  closeEditors,
  createFile,
  showInEditor,
} from '../../../test/test-utils-vscode';
import {
  ADD_CALLOUT_COMMAND,
  REMOVE_CALLOUT_COMMAND,
} from './callout-commands';

describe('callout editor commands', () => {
  beforeEach(async () => {
    await cleanWorkspace();
    await closeEditors();
  });

  afterEach(async () => {
    await cleanWorkspace();
    await closeEditors();
  });

  it('adds the default callout around the selected lines', async () => {
    const { uri } = await createFile('First line\nSecond line', [
      'callout-command.md',
    ]);
    const { editor } = await showInEditor(uri);
    editor.selection = new vscode.Selection(0, 0, 1, 4);

    await vscode.commands.executeCommand(ADD_CALLOUT_COMMAND);

    expect(editor.document.getText()).toBe(
      '> [!info]\n> First line\n> Second line'
    );
  });

  it('removes a callout marker and quote prefixes from the selected block', async () => {
    const { uri } = await createFile(
      '> [!warning] Title\n> First line\n> Second line',
      ['callout-command.md']
    );
    const { editor } = await showInEditor(uri);
    editor.selection = new vscode.Selection(0, 0, 2, 13);

    await vscode.commands.executeCommand(REMOVE_CALLOUT_COMMAND);

    expect(editor.document.getText()).toBe('Title\nFirst line\nSecond line');
  });
});
