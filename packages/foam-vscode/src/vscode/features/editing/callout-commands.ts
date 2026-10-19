import {
  commands,
  EndOfLine,
  ExtensionContext,
  Position,
  Range,
  window,
} from 'vscode';
import { getFoamVsCodeConfig } from '../../config';
import {
  CalloutAliases,
  CONFIG_CALLOUT_ALIASES,
  CONFIG_CALLOUT_ALIASES_ENABLED,
  CONFIG_CALLOUT_BUILTIN_ALIASES,
  CONFIG_CALLOUT_GITHUB_ONLY,
  DEFAULT_BUILTIN_CALLOUT_ALIASES,
  DEFAULT_CUSTOM_CALLOUT_ALIASES,
  combineCalloutAliases,
  readBuiltinCalloutAliases,
} from '../preview/callout';
import {
  getCalloutTypeForCurrentMode,
  removeCalloutMarkup,
  wrapSelectionInCallout,
} from './callout-edit';

export const ADD_CALLOUT_COMMAND = 'foam-vscode.add-callout';
export const REMOVE_CALLOUT_COMMAND = 'foam-vscode.remove-callout';
export const DEFAULT_CALLOUT_TYPE_SETTING = 'callout.defaultType';

const INFO_CALLOUT_TYPE = 'info';

export default function activate(context: ExtensionContext): void {
  context.subscriptions.push(
    commands.registerCommand(ADD_CALLOUT_COMMAND, addCallout),
    commands.registerCommand(REMOVE_CALLOUT_COMMAND, removeCallout)
  );
}

function addCallout(): Thenable<void> | undefined {
  const editor = window.activeTextEditor;
  if (!editor) {
    return;
  }
  if (editor.selection.isEmpty) {
    window.showWarningMessage('Select Markdown text to add a callout.');
    return;
  }

  const aliases = getConfiguredCalloutAliases();
  const type = getCalloutTypeForCurrentMode(
    getFoamVsCodeConfig<string>(
      DEFAULT_CALLOUT_TYPE_SETTING,
      INFO_CALLOUT_TYPE
    ),
    getFoamVsCodeConfig<boolean>(CONFIG_CALLOUT_GITHUB_ONLY, true),
    getFoamVsCodeConfig<boolean>(CONFIG_CALLOUT_ALIASES_ENABLED, false),
    aliases
  );
  const range = getSelectedLinesRange(editor);
  const selectedText = editor.document.getText(range);
  const lineEnding = editor.document.eol === EndOfLine.CRLF ? '\r\n' : '\n';
  const wrappedText = wrapSelectionInCallout(selectedText, type, lineEnding);
  if (wrappedText === null) {
    window.showWarningMessage('Select Markdown text to add a callout.');
    return;
  }

  return editor
    .edit(editBuilder => {
      editBuilder.replace(range, wrappedText);
    })
    .then(applied => {
      if (!applied) {
        window.showErrorMessage('Foam could not add the callout.');
      }
    });
}

function removeCallout(): Thenable<void> | undefined {
  const editor = window.activeTextEditor;
  if (!editor) {
    return;
  }
  if (editor.selection.isEmpty) {
    window.showWarningMessage('Select a callout to remove it.');
    return;
  }

  const range = getSelectedLinesRange(editor);
  const selectedText = editor.document.getText(range);
  const unwrappedText = removeCalloutMarkup(selectedText);
  if (unwrappedText === null) {
    window.showWarningMessage(
      'The selection does not start with a callout marker.'
    );
    return;
  }

  return editor
    .edit(editBuilder => {
      editBuilder.replace(range, unwrappedText);
    })
    .then(applied => {
      if (!applied) {
        window.showErrorMessage('Foam could not remove the callout.');
      }
    });
}

function getConfiguredCalloutAliases(): CalloutAliases {
  return combineCalloutAliases(
    readBuiltinCalloutAliases(
      getFoamVsCodeConfig(
        CONFIG_CALLOUT_BUILTIN_ALIASES,
        DEFAULT_BUILTIN_CALLOUT_ALIASES
      )
    ),
    getFoamVsCodeConfig(CONFIG_CALLOUT_ALIASES, DEFAULT_CUSTOM_CALLOUT_ALIASES)
  );
}

function getSelectedLinesRange(
  editor: NonNullable<typeof window.activeTextEditor>
) {
  const { document, selection } = editor;
  const start = new Position(selection.start.line, 0);
  const end =
    selection.end.line > selection.start.line && selection.end.character === 0
      ? selection.end
      : new Position(
          selection.end.line,
          document.lineAt(selection.end.line).text.length
        );
  return new Range(start, end);
}
