import {
  getCalloutTypeForCurrentMode,
  removeCalloutMarkup,
  wrapSelectionInCallout,
} from './callout-edit';

describe('callout editor commands', () => {
  it('wraps selected markdown lines as a callout and preserves the line ending', () => {
    expect(
      wrapSelectionInCallout('First line\r\nSecond line\r\n', 'info', '\r\n')
    ).toBe('> [!info]\r\n> First line\r\n> Second line\r\n');
  });

  it('does not add quote markers to empty selected text', () => {
    expect(wrapSelectionInCallout('', 'info', '\n')).toBeNull();
  });

  it('removes callout markers and keeps the title and body text', () => {
    expect(
      removeCalloutMarkup('> [!warning]- A title\n> Body line\n> Second line\n')
    ).toBe('A title\nBody line\nSecond line\n');
  });

  it('does not change selections that are not callouts', () => {
    expect(removeCalloutMarkup('> Ordinary quote\n> More quote\n')).toBeNull();
  });

  it('falls back to info when the configured type is unavailable in the active mode', () => {
    const aliases = { note: 'memo', warning: 'warn' };

    expect(getCalloutTypeForCurrentMode('warn', true, true, aliases)).toBe(
      'info'
    );
    expect(getCalloutTypeForCurrentMode('memo', false, false, aliases)).toBe(
      'info'
    );
    expect(getCalloutTypeForCurrentMode('warning', true, false, aliases)).toBe(
      'warning'
    );
    expect(getCalloutTypeForCurrentMode('memo', false, true, aliases)).toBe(
      'memo'
    );
  });
});
