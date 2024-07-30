/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */

// https://github.com/lezer-parser/markdown/tree/main/src

import { tags as t } from '@lezer/highlight'
import type { BlockContext, Element, InlineContext,	LeafBlock, LeafBlockParser, Line, MarkdownConfig } from './markdown'
import { Punctuation, space } from './markdown'
import { markTag } from '../customTags'

const StrikethroughDelim = { resolve: 'Strikethrough', mark: 'StrikethroughMark' }

/// An extension that implements
/// [GFM-style](https://github.github.com/gfm/#strikethrough-extension-)
/// Strikethrough syntax using `~~` delimiters.
export const Strikethrough: MarkdownConfig = {
	defineNodes: [{
		name: 'Strikethrough',
		style: { 'Strikethrough/...': t.strikethrough }
	}, {
		name: 'StrikethroughMark',
		style: markTag
	}],
	parseInline: [{
		name: 'Strikethrough',
		parse(cx, next, pos) {
			if (next != 126 /* '~' */ || cx.char(pos + 1) != 126 || cx.char(pos + 2) == 126)
				return -1
			const before = cx.slice(pos - 1, pos); const after = cx.slice(pos + 2, pos + 3)
			const sBefore = /\s|^$/.test(before); const sAfter = /\s|^$/.test(after)
			const pBefore = Punctuation.test(before); const pAfter = Punctuation.test(after)
			return cx.addDelimiter(StrikethroughDelim, pos, pos + 2, !sAfter && (!pAfter || sBefore || pBefore), !sBefore && (!pBefore || sAfter || pAfter))
		},
		after: 'Emphasis'
	}]
}

class TaskParser implements LeafBlockParser {
	nextLine() { return false }

	finish(cx: BlockContext, leaf: LeafBlock) {
		cx.addLeafElement(leaf, cx.elt('Task', leaf.start, leaf.start + leaf.content.length, [
			cx.elt('TaskMarker', leaf.start, leaf.start + 3),
			...cx.parser.parseInline(leaf.content.slice(3), leaf.start + 3)
		]))
		return true
	}
}

/// Extension providing
/// [GFM-style](https://github.github.com/gfm/#task-list-items-extension-)
/// task list items, where list items can be prefixed with `[ ]` or
/// `[x]` to add a checkbox.
export const TaskList: MarkdownConfig = {
	defineNodes: [
		{ name: 'Task', block: true, style: t.list },
		{ name: 'TaskMarker', style: t.atom }
	],
	parseBlock: [{
		name: 'TaskList',
		leaf(cx, leaf) {
			return /^\[[ x]\][ \t]/i.test(leaf.content) && cx.parentType().name == 'ListItem' ? new TaskParser() : null
		}
	}]
}

/// Extension bundle containing [`Table`](#Table),
/// [`TaskList`](#TaskList), [`Strikethrough`](#Strikethrough)
export const GFM = [TaskList, Strikethrough]
