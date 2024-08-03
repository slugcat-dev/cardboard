import { tags as t } from '@lezer/highlight'
import type { BlockContext, LeafBlock, LeafBlockParser, MarkdownExtension } from './lezer-markdown'
import { markTag, underlineItalicTag, underlineTag } from './customTags'
import { Punctuation } from './lezer-markdown/markdown'

const underscore = '_'.charCodeAt(0)
const tilde = '~'.charCodeAt(0)
const UnderlineDelim = { resolve: 'Underline', mark: 'UnderlineMark' }
const UnderlineItalicDelim = { resolve: 'UnderlineItalic', mark: 'UnderlineItalicMark' }
const StrikethroughDelim = { resolve: 'Strikethrough', mark: 'StrikethroughMark' }

export const Underline: MarkdownExtension = {
	defineNodes: [
		{ name: 'Underline', style: { 'Underline/...': underlineTag } },
		{ name: 'UnderlineMark', style: markTag }
	],
	parseInline: [{
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
	}]
}

export const UnderlineItalic: MarkdownExtension = {
	defineNodes: [
		{ name: 'UnderlineItalic', style: { 'UnderlineItalic/...': underlineItalicTag } },
		{ name: 'UnderlineItalicMark', style: markTag }
	],
	parseInline: [{
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
	}]
}

export const Strikethrough: MarkdownExtension = {
	defineNodes: [
		{ name: 'Strikethrough', style: { 'Strikethrough/...': t.strikethrough }	},
		{ name: 'StrikethroughMark', style: markTag }
	],
	parseInline: [{
		name: 'Strikethrough',
		parse(cx, next, pos) {
			if (
				next !== tilde
				|| cx.char(pos + 1) !== tilde
				|| cx.char(pos + 2) === tilde
			)
				return -1

			const before = cx.slice(pos - 1, pos)
			const after = cx.slice(pos + 2, pos + 3)
			const spaceBefore = /\s|^$/.test(before)
			const spaceAfter = /\s|^$/.test(after)
			const punctuationBefore = Punctuation.test(before)
			const punctuationAfter = Punctuation.test(after)

			return cx.addDelimiter(
				StrikethroughDelim,
				pos,
				pos + 2,
				!spaceAfter && (!punctuationAfter || spaceBefore || punctuationBefore),
				!spaceBefore && (!punctuationBefore || spaceAfter || punctuationAfter)
			)
		},
		after: 'Emphasis'
	}]
}

class HighlightLineParser implements LeafBlockParser {
	nextLine() {
		return true
	}

	finish(cx: BlockContext, leaf: LeafBlock) {
		if (leaf.content.startsWith('!! ')) {
			cx.addLeafElement(
				leaf,
				cx.elt('Highlight', leaf.start, leaf.start + leaf.content.length, [
					cx.elt('HighlightMark', leaf.start, leaf.start + 2),
					...cx.parser.parseInline(leaf.content.slice(3), leaf.start + 3)
				])
			)

			return true
		}

		return false
	}
}

export const HighlightLine: MarkdownExtension = {
	defineNodes: [
		{ name: 'Highlight' },
		{ name: 'HighlightMark', style: markTag }
	],
	parseBlock: [{
		name: 'Highlight',
		leaf() {
			return new HighlightLineParser()
		},
		endLeaf() {
			return true
		}
	}]
}

class TaskParser implements LeafBlockParser {
	nextLine() {
		return false
	}

	finish(cx: BlockContext, leaf: LeafBlock) {
		cx.addLeafElement(
			leaf,
			cx.elt('Task', leaf.start, leaf.start + leaf.content.length, [
				cx.elt('TaskMarker', leaf.start, leaf.start + 3),
				...cx.parser.parseInline(leaf.content.slice(3), leaf.start + 3)
			])
		)

		return true
	}
}

export const TaskList: MarkdownExtension = {
	defineNodes: [
		{ name: 'Task', block: true, style: t.list },
		{ name: 'TaskMarker', style: t.atom }
	],
	parseBlock: [{
		name: 'TaskList',
		leaf(cx, leaf) {
			return /^\[[ x]\][ \t]/i.test(leaf.content) && cx.parentType().name === 'ListItem' ? new TaskParser() : null
		}
	}]
}

// Autolink
const autolinkStart = /(https?:\/\/[^\W_])|[^\W_](?:[\w.+-]*[^\W_])?@[^\W_]/gy
const emailEnd = /[\w-]*(?:\.[^\W_](?:[\w-]*[^\W_])?)+/gy

const urlEnd = /[\w-]*(?:\.[^\W_](?:[\w-]*[^\W_])?)*(?::\d{1,5})?(?:\/[^\s<]*)?/gy

function count(str: string, from: number, to: number, ch: string) {
	let result = 0

	for (let i = from; i < to; i++) {
		if (str[i] === ch)
			result++
	}

	return result
}

function autolinkURLEnd(text: string, from: number) {
	urlEnd.lastIndex = from

	const match = urlEnd.exec(text)

	if (!match)
		return -1

	let end = from + match[0].length

	for (;;) {
		const last = text[end - 1]

		// TODO: bracket matching
		// TODO: *_~
		if (
			/[?!.,:*_~]/.test(last)
			|| (last === ')' && count(text, from, end, ')') > count(text, from, end, '('))
			|| (last === ']' && count(text, from, end, ']') > count(text, from, end, '['))
			|| (last === '}' && count(text, from, end, '}') > count(text, from, end, '{'))
		)
			end--
		else
			break
	}

	return end
}

export const Autolink: MarkdownExtension = {
	parseInline: [{
		name: 'Autolink',
		parse(cx, next, absPos) {
			const pos = absPos - cx.offset

			autolinkStart.lastIndex = pos

			const startMatch = autolinkStart.exec(cx.text)
			let end = -1

			if (!startMatch)
				return -1

			const from = pos + startMatch[0].length

			if (startMatch[1])
				end = autolinkURLEnd(cx.text, from)
			else {
				emailEnd.lastIndex = from

				const endMatch = emailEnd.exec(cx.text)

				if (!endMatch)
					return -1

				end = from + endMatch[0].length
			}

			if (end < 0)
				return -1

			cx.addElement(cx.elt('URL', absPos, end + cx.offset))

			return end + cx.offset
		}
	}]
}
