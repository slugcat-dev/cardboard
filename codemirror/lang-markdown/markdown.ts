/* eslint-disable no-cond-assign */
// https://github.com/codemirror/lang-markdown/tree/main/src

import { Language, LanguageDescription, ParseContext, defineLanguageFacet, foldNodeProp, foldService,	indentNodeProp, languageDataProp, syntaxTree } from '@codemirror/language'
import type { NodeType, SyntaxNode } from '@lezer/common'
import { NodeProp } from '@lezer/common'
import type { MarkdownParser } from '../lezer-markdown'
import { parser as baseParser } from '../lezer-markdown'

const data = defineLanguageFacet()
const headingProp = new NodeProp<number>()
const commonmark = baseParser.configure({
	props: [
		foldNodeProp.add((type) => {
			return !type.is('Block')
				|| type.is('Document')
				|| isHeading(type) !== null
				|| isList(type)
				? undefined
				: (tree, state) => ({ from: state.doc.lineAt(tree.from).to, to: tree.to })
		}),
		headingProp.add(isHeading),
		indentNodeProp.add({ Document: () => null }),
		languageDataProp.add({ Document: data })
	]
})

function isHeading(type: NodeType) {
	const match = /^ATXHeading(\d)$/.exec(type.name)

	return match ? +match[1] : undefined
}

function isList(type: NodeType) {
	return type.name === 'OrderedList' || type.name === 'BulletList'
}

function findSectionEnd(headerNode: SyntaxNode, level: number) {
	let last = headerNode

	for (;;) {
		const next = last.nextSibling
		let heading

		if (!next || ((heading = isHeading(next.type)) && heading <= level))
			break

		last = next
	}

	return last.to
}

const headerIndent = foldService.of((state, start, end) => {
	for (let node: SyntaxNode | null = syntaxTree(state).resolveInner(end, -1); node; node = node.parent) {
		if (node.from < start)
			break

		const heading = node.type.prop(headingProp)

		if (!heading)
			continue

		const upto = findSectionEnd(node, heading)

		if (upto > end)
			return { from: end, to: upto }
	}

	return null
})

export function mkLang(parser: MarkdownParser) {
	return new Language(data, parser, [headerIndent], 'markdown')
}

export const commonmarkLanguage = mkLang(commonmark)
export const markdownLanguage = commonmarkLanguage

export function getCodeParser(
	languages: readonly LanguageDescription[] | ((info: string) => Language | LanguageDescription | null) | undefined,
	defaultLanguage?: Language
) {
	return (info: string) => {
		if (info && languages) {
			let found = null

			// Strip anything after whitespace
			info = /\S*/.exec(info)![0]

			if (typeof languages === 'function')
				found = languages(info)
			else
				found = LanguageDescription.matchLanguageName(languages, info, true)

			if (found instanceof LanguageDescription)
				return found.support ? found.support.language.parser : ParseContext.getSkippingParser(found.load())
			else if (found)
				return found.parser
		}

		return defaultLanguage ? defaultLanguage.parser : null
	}
}
