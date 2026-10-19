import { createMarkdownParser, FoamGraph } from '@foam/core';
import { createTestWorkspace } from '@foam/core/test';
import { createFoamMarkdownIt } from './foam-markdown-it';
import {
  CalloutAliases,
  DEFAULT_CALLOUT_ALIASES,
  DEFAULT_CUSTOM_CALLOUT_ALIASES,
  readBuiltinCalloutAliases,
} from './callout';

describe('callouts', () => {
  const build = (
    calloutAliases?: CalloutAliases,
    options: { githubOnly?: boolean; aliasesEnabled?: boolean } = {}
  ) => {
    const workspace = createTestWorkspace();
    return createFoamMarkdownIt({
      workspace,
      graph: FoamGraph.fromWorkspace(workspace),
      parser: createMarkdownParser([]),
      linkResolver: () => ({}),
      getCurrentResource: () => null,
      calloutAliases,
      githubOnly: options.githubOnly ?? false,
      calloutAliasesEnabled: options.aliasesEnabled ?? true,
    });
  };

  it('keeps built-in alias names fixed while allowing alias values to be empty', () => {
    expect(
      readBuiltinCalloutAliases({
        note: ' memo ',
        warning: '',
      })
    ).toEqual({
      note: ' memo ',
      tip: 'hint',
      important: 'must',
      warning: '',
      caution: '!!!,danger',
    });
  });

  it('renders a typed callout with its title and body', () => {
    const html = build().render('> [!info] Details\n> Body text\n');

    expect(html).toContain('class="foam-callout callout"');
    expect(html).toContain('data-callout="info"');
    expect(html).toContain('class="foam-callout-title"');
    expect(html).toContain('Details');
    expect(html).toContain('Body text');
    expect(html).not.toContain('[!info]');
  });

  it('renders unknown callout types for user-defined CSS', () => {
    const html = build().render('> [!my-custom-type] Custom\n> Body text\n');

    expect(html).toContain('data-callout="my-custom-type"');
    expect(html).toContain('Custom');
  });

  it('resolves aliases case-insensitively while preserving their CSS selector', () => {
    const md = build(
      {
        ' Error ': [' X ', ' Failure '],
        Info: [' Information '],
      },
      { aliasesEnabled: true }
    );
    const alias = md.render('> [! x ] Failed\n> Body\n');
    const differentlyCasedAlias = md.render('> [!INFORMATION]\n> Body\n');

    expect(alias).toContain('class="foam-callout callout" data-callout="x"');
    expect(alias).toContain('data-callout-type="error"');
    expect(alias).toContain('data-icon="x"');
    expect(differentlyCasedAlias).toContain('data-callout="INFORMATION"');
    expect(differentlyCasedAlias).toContain('data-callout-type="info"');
    expect(differentlyCasedAlias).toContain('data-icon="info"');
  });

  it('splits comma-separated aliases and trims surrounding whitespace', () => {
    const md = build({ note: ' information, memo ' });
    const html = md.render('> [! INFORMATION ]\n> Body\n');

    expect(html).toContain('data-callout="INFORMATION"');
    expect(html).toContain('data-callout-type="note"');
    expect(md.render('> [!memo]\n> Body\n')).toContain(
      'data-callout-type="note"'
    );
  });

  it('resolves punctuation aliases without conflating different values', () => {
    const md = build(
      {
        warning: '!,warn,attention,!!!',
        caution: '!!!,danger',
        waitting: '==',
        faq: 'help,question,?',
      },
      { aliasesEnabled: true }
    );
    const warning = md.render('> [!!]\n> Warning.\n');
    const caution = md.render('> [!!!!]\n> Caution.\n');
    const waiting = md.render('> [!==]\n> Waiting.\n');
    const faq = md.render('> [!?]\n> FAQ.\n');

    expect(warning).toContain('data-callout="!"');
    expect(warning).toContain('data-callout-type="warning"');
    expect(caution).toContain('data-callout="!!!"');
    expect(caution).toContain('data-callout-type="caution"');
    expect(waiting).toContain('data-callout="=="');
    expect(waiting).toContain('data-callout-type="waitting"');
    expect(faq).toContain('data-callout="?"');
    expect(faq).toContain('data-callout-type="faq"');
  });

  it('prefers the caution preset for the shared legacy warning alias', () => {
    const md = build(
      {
        warning: '!,warn,attention,!!!',
        caution: '!!!,danger',
      },
      { aliasesEnabled: true }
    );

    expect(md.render('> [!!]\n> Warning.\n')).toContain(
      'data-callout-type="warning"'
    );
    expect(md.render('> [!!!!]\n> Caution.\n')).toContain(
      'data-callout-type="caution"'
    );
  });

  it('uses the updated FAQ and waitting aliases by default', () => {
    const md = build(DEFAULT_CALLOUT_ALIASES);
    expect(DEFAULT_CUSTOM_CALLOUT_ALIASES.faq).toContain('?');
    expect(DEFAULT_CUSTOM_CALLOUT_ALIASES.waitting).toEqual(['==']);
    expect(md.render('> [!?]\n> FAQ.\n')).toContain('data-callout-type="faq"');
    expect(md.render('> [!==]\n> Waiting.\n')).toContain(
      'data-callout-type="waitting"'
    );
    expect(md.render('> [! =]\n> No longer an alias.\n')).toContain(
      'data-callout-type="="'
    );
  });

  it('does not restore aliases removed from the settings map', () => {
    const html = build({ done: '' }).render('> [!complete]\n> Body\n');

    expect(html).toContain('data-callout-type="complete"');
    expect(html).not.toContain('data-callout-type="done"');
  });

  it('renders only GitHub-supported alerts in GitHub-only mode', () => {
    const md = build({}, { githubOnly: true, aliasesEnabled: true });
    for (const type of ['note', 'tip', 'important', 'warning', 'caution']) {
      expect(md.render(`> [!${type}]\n> Body\n`)).toContain(
        'class="foam-callout callout"'
      );
    }

    const unsupported = md.render('> [!danger]\n> Body\n');
    expect(unsupported).toContain('<blockquote>');
    expect(unsupported).not.toContain('foam-callout');

    const info = md.render('> [!info]\n> Body\n');
    expect(info).toContain('data-callout="info"');
    expect(info).toContain('data-callout-type="note"');
  });

  it('does not resolve aliases in GitHub-only mode', () => {
    const md = build(
      { note: ['info'] },
      {
        githubOnly: true,
        aliasesEnabled: true,
      }
    );

    expect(md.render('> [!INFO]\n> Body\n')).toContain(
      'data-callout-type="note"'
    );
    expect(md.render('> [!X]\n> Body\n')).toContain('<blockquote>');
    expect(md.render('> [!NOTE]\n> Body\n')).toContain('data-callout="NOTE"');
  });

  it('enables alias resolution only when requested in extended mode', () => {
    const aliases = { error: ['x'] };
    const withoutAliases = build(aliases, { aliasesEnabled: false }).render(
      '> [!X]\n> Failed.\n'
    );
    const withAliases = build(aliases, { aliasesEnabled: true }).render(
      '> [!X]\n> Failed.\n'
    );

    expect(withoutAliases).toContain('data-callout-type="x"');
    expect(withoutAliases).not.toContain('data-callout-type="error"');
    expect(withAliases).toContain('data-callout-type="error"');
  });

  it('renders common non-GitHub presets in extended mode', () => {
    const html = build(undefined, { githubOnly: false }).render(
      '> [!danger]\n> Body\n'
    );

    expect(html).toContain('data-callout="danger"');
    expect(html).toContain('data-callout-type="caution"');
    expect(html).toContain('data-icon="x"');
  });

  it('provides common aliases by default', () => {
    const error = build().render('> [!X]\n> Failed.\n');
    const md = build(DEFAULT_CALLOUT_ALIASES);
    const warningTypes = ['!', 'warn', 'attention'].map(type =>
      md.render(`> [!${type}]\n> Careful.\n`)
    );
    const cautionTypes = ['!!!', 'danger'].map(type =>
      md.render(`> [!${type}]\n> Caution.\n`)
    );
    const important = build(DEFAULT_CALLOUT_ALIASES).render(
      '> [!must]\n> Must.\n'
    );
    const tip = build(DEFAULT_CALLOUT_ALIASES).render('> [!hint]\n> Hint.\n');
    const done = build(DEFAULT_CALLOUT_ALIASES).render(
      '> [!success]\n> Done.\n'
    );

    expect(error).toContain('data-callout-type="error"');
    for (const warning of warningTypes) {
      expect(warning).toContain('data-callout-type="warning"');
    }
    for (const caution of cautionTypes) {
      expect(caution).toContain('data-callout-type="caution"');
    }
    expect(important).toContain('data-callout-type="important"');
    expect(tip).toContain('data-callout-type="tip"');
    expect(done).toContain('data-callout-type="done"');
  });

  it('provides the complete workflow callout presets and aliases', () => {
    expect(DEFAULT_CUSTOM_CALLOUT_ALIASES).not.toHaveProperty('danger');
    expect(DEFAULT_CUSTOM_CALLOUT_ALIASES).not.toHaveProperty('hint');
    expect(DEFAULT_CUSTOM_CALLOUT_ALIASES).not.toHaveProperty('success');
    expect(DEFAULT_CUSTOM_CALLOUT_ALIASES).toMatchObject({
      idea: [],
      todo: [],
      doing: ['>>'],
      waitting: ['=='],
      giveup: [],
      done: ['success', '√', 'V'],
    });

    const md = build(DEFAULT_CALLOUT_ALIASES);
    expect(md.render('> [!idea]\n> Idea.\n')).toContain(
      'data-icon="lightbulb"'
    );
    expect(md.render('> [!todo]\n> Task.\n')).toContain('data-icon="square"');
    expect(md.render('> [!>>]\n> In progress.\n')).toContain(
      'data-callout-type="doing"'
    );
    expect(md.render('> [!==]\n> Waiting.\n')).toContain(
      'data-callout-type="waitting"'
    );
    expect(md.render('> [!√]\n> Complete.\n')).toContain(
      'data-callout-type="done"'
    );
    expect(md.render('> [!V]\n> Complete.\n')).toContain(
      'data-callout-type="done"'
    );
    expect(md.render('> [!giveup]\n> Giving up.\n')).toContain(
      'data-icon="ban"'
    );
  });

  it('uses an unchecked checkbox icon for todo callouts', () => {
    const html = build().render('> [!todo]\n> Task.\n');

    expect(html).toContain('data-icon="square"');
  });

  it('renders default icons through an overridable CSS mask', () => {
    const html = build().render('> [!info]\n> Body\n');

    expect(html).toContain('class="foam-callout-icon callout-icon"');
    expect(html).toContain('--foam-callout-default-icon: url(');
    expect(html).toContain('data:image/svg+xml,');
  });

  it('uses the same icon for types with the same meaning', () => {
    const info = build().render('> [!info]\n> Body\n');
    const note = build().render('> [!note]\n> Body\n');

    expect(info).toContain('data-icon="info"');
    expect(note).toContain('data-icon="info"');
  });

  it('distinguishes warning and caution callouts', () => {
    const md = build(DEFAULT_CALLOUT_ALIASES);
    const warning = md.render('> [!!]\n> Warning.\n');
    const caution = md.render('> [!!!!]\n> Caution.\n');

    expect(warning).toContain('data-callout-type="warning"');
    expect(warning).toContain('data-icon="warning"');
    expect(caution).toContain('data-callout-type="caution"');
    expect(caution).toContain('data-icon="x"');
  });

  it('uses distinct icons for different callout meanings', () => {
    const tip = build().render('> [!tip]\n> Body\n');
    const question = build().render('> [!question]\n> Body\n');
    const warning = build().render('> [!warning]\n> Body\n');
    const important = build().render('> [!important]\n> Body\n');

    expect(tip).toContain('data-icon="lightbulb"');
    expect(question).toContain('data-icon="help"');
    expect(warning).toContain('data-icon="warning"');
    expect(important).toContain('data-icon="star"');
  });

  it('preserves Markdown formatting in the title and body', () => {
    const html = build().render(
      '> [!info] **Important**\n> Body with **emphasis**.\n'
    );

    expect(html).toContain('<strong>Important</strong>');
    expect(html).toContain('Body with <strong>emphasis</strong>.');
  });

  it('renders each body source line on a new line without a trailing backslash', () => {
    const html = build().render(
      '> [!warning]- Details\n> First line\n> Second line\n'
    );

    expect(html).toContain('First line<br>\nSecond line');
  });

  it('renders a collapsed callout as a native disclosure', () => {
    const html = build().render('> [!info]- Details\n> Body text\n');

    expect(html).toContain('<details class="foam-callout callout"');
    expect(html).toContain('<summary class="foam-callout-title"');
    expect(html).not.toContain('<details open');
    expect(html).toContain('Details');
    expect(html).toContain('Body text');
  });

  it('uses the callout type as the title when none is provided', () => {
    const html = build().render('> [!info]\n> Body text\n');

    expect(html).toContain('foam-callout-title-text">Info</span>');
    expect(html).toContain('Body text');
  });

  it('leaves ordinary blockquotes unchanged', () => {
    const html = build().render('> A regular quote.\n');

    expect(html).toContain('<blockquote>');
    expect(html).toContain('<p>A regular quote.</p>');
    expect(html).not.toContain('foam-callout');
  });

  it('keeps soft line breaks in ordinary blockquotes unchanged', () => {
    const html = build().render('> First quote line\n> Second quote line\n');

    expect(html).toContain('First quote line\nSecond quote line');
    expect(html).not.toContain('First quote line<br>');
  });

  it('leaves malformed callout markers as ordinary blockquotes', () => {
    const html = build().render('> [!info]without a title separator\n');

    expect(html).toContain('<blockquote>');
    expect(html).toContain('[!info]without a title separator');
    expect(html).not.toContain('foam-callout');
  });
});
