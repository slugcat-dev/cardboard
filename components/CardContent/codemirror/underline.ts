import { tags } from '@lezer/highlight'
import type { MarkdownExtension } from './lezer-markdown'
import { markTag, underlineItalicTag, underlineTag } from './customTags'

const underscore = '_'.charCodeAt(0)
const Punctuation = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~\xA1\u2010-\u2027]/
const UnderlineDelim = { resolve: 'Underline', mark: 'UnderlineMark' }
const UnderlineItalicDelim = { resolve: 'UnderlineItalic', mark: 'UnderlineItalicMark' }

export const Underline: MarkdownExtension = {
	defineNodes: [
		{ name: 'Underline', style: { 'Underline/...': underlineTag } },
		{ name: 'UnderlineMark', style: markTag }
	],
	parseInline: [
		{
			name: 'Underline',
			parse(cx, next, pos) {
				if (
					next !== underscore
					|| cx.char(pos + 1) !== underscore
					|| cx.char(pos + 2) === underscore
				)
					return -1

				const before = cx.slice(pos - 1, pos)
				const after = cx.slice(pos + 2, pos + 3)
				const spaceBefore = /\s|^$/.test(before)
				const spaceAfter = /\s|^$/.test(after)
				const punctuationBefore = Punctuation.test(before)
				const punctuationAfter = Punctuation.test(after)

				return cx.addDelimiter(
					UnderlineDelim,
					pos,
					pos + 2,
					!spaceAfter && (!punctuationAfter || spaceBefore || punctuationBefore),
					!spaceBefore && (!punctuationBefore || spaceAfter || punctuationAfter)
				)
			},
			before: 'Emphasis'
		}
	]
}

export const UnderlineItalic: MarkdownExtension = {
	defineNodes: [
		{ name: 'UnderlineItalic', style: { 'UnderlineItalic/...': underlineItalicTag } },
		{ name: 'UnderlineItalicMark', style: markTag }
	],
	parseInline: [
		{
			name: 'UnderlineItalic',
			parse(cx, next, pos) {
				if (
					next !== underscore
					|| cx.char(pos + 1) !== underscore
					|| cx.char(pos + 2) !== underscore
					|| cx.char(pos + 3) === underscore
				)
					return -1

				const before = cx.slice(pos - 1, pos)
				const after = cx.slice(pos + 2, pos + 4)
				const spaceBefore = /\s|^$/.test(before)
				const spaceAfter = /\s|^$/.test(after)
				const punctuationBefore = Punctuation.test(before)
				const punctuationAfter = Punctuation.test(after)

				return cx.addDelimiter(
					UnderlineItalicDelim,
					pos,
					pos + 3,
					!spaceAfter && (!punctuationAfter || spaceBefore || punctuationBefore),
					!spaceBefore && (!punctuationBefore || spaceAfter || punctuationAfter)
				)
			},
			before: 'Emphasis'
		}
	]
}
