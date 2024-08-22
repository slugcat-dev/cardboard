// https://github.com/codemirror/lang-markdown

import { Prec } from '@codemirror/state'
import type { KeyBinding } from '@codemirror/view'
import { keymap } from '@codemirror/view'
import type { Language, LanguageDescription } from '@codemirror/language'
import { LanguageSupport } from '@codemirror/language'
import { indentLess } from '@codemirror/commands'
import type { MarkdownExtension } from '../lezer-markdown'
import { MarkdownParser, parseCode } from '../lezer-markdown'
import { commonmarkLanguage, getCodeParser, markdownLanguage, mkLang } from './markdown'
import { deleteMarkupBackward, handleHome, handleTab, insertNewlineContinueMarkup } from './commands'

export { commonmarkLanguage, markdownLanguage, insertNewlineContinueMarkup, deleteMarkupBackward }

/// A small keymap with Markdown-specific bindings. Binds Enter to
/// [`insertNewlineContinueMarkup`](#lang-markdown.insertNewlineContinueMarkup)
/// and Backspace to
/// [`deleteMarkupBackward`](#lang-markdown.deleteMarkupBackward).
export const markdownKeymap: readonly KeyBinding[] = [
	{ key: 'Enter', run: insertNewlineContinueMarkup },
	{ key: 'Backspace', run: deleteMarkupBackward },
	{ key: 'Tab', run: handleTab, shift: indentLess },
	{ key: 'Home', run: handleHome }
]

/// Markdown language support.
export function markdown(config: {
	/// When given, this language will be used by default to parse code
	/// blocks.
	defaultCodeLanguage?: Language | LanguageSupport
	/// A source of language support for highlighting fenced code
	/// blocks. When it is an array, the parser will use
	/// [`LanguageDescription.matchLanguageName`](#language.LanguageDescription^matchLanguageName)
	/// with the fenced code info to find a matching language. When it
	/// is a function, will be called with the info string and may
	/// return a language or `LanguageDescription` object.
	codeLanguages?: readonly LanguageDescription[] | ((info: string) => Language | LanguageDescription | null)
	/// Markdown parser
	/// [extensions](https://github.com/lezer-parser/markdown#user-content-markdownextension)
	/// to add to the parser.
	extensions?: MarkdownExtension
	/// The base language to use. Defaults to
	/// [`commonmarkLanguage`](#lang-markdown.commonmarkLanguage).
	base?: Language
} = {}) {
	const { codeLanguages, defaultCodeLanguage, base: { parser } = commonmarkLanguage } = config

	if (!(parser instanceof MarkdownParser))
		throw new RangeError('Base parser provided to `markdown` should be a Markdown parser')

	const extensions = config.extensions ? [config.extensions] : []
	const support = []
	let defaultCode

	if (defaultCodeLanguage instanceof LanguageSupport) {
		support.push(defaultCodeLanguage.support)

		defaultCode = defaultCodeLanguage.language
	} else if (defaultCodeLanguage)
		defaultCode = defaultCodeLanguage

	const codeParser = codeLanguages || defaultCode ? getCodeParser(codeLanguages, defaultCode) : undefined

	extensions.push(parseCode({ codeParser }))
	support.push(Prec.high(keymap.of(markdownKeymap)))

	const lang = mkLang(parser.configure(extensions))

	return new LanguageSupport(lang, support)
}
