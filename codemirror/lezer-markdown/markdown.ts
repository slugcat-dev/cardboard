/* eslint-disable no-cond-assign */
// https://github.com/lezer-parser/markdown/tree/main/src

import type { Input, NodePropSource, ParseWrapper, PartialParse,	SyntaxNode, TreeBuffer, TreeCursor, TreeFragment } from '@lezer/common'
import { NodeProp, NodeSet, NodeType, Parser, Tree } from '@lezer/common'
import { Tag, styleTags, tags as t } from '@lezer/highlight'
import { markTag, underlineTag } from '../customTags'

class CompositeBlock {
	static create(type: number, value: number, from: number, parentHash: number, end: number) {
		const hash = (parentHash + (parentHash << 8) + type + (value << 4)) | 0
		return new CompositeBlock(type, value, from, hash, end, [], [])
	}

	/// @internal
	hashProp: [NodeProp<any>, any][]

	constructor(readonly type: number,
		// Used for indentation in list items, markup character in lists
		readonly value: number, readonly from: number, readonly hash: number, public end: number, readonly children: (Tree | TreeBuffer)[], readonly positions: number[]) {
		this.hashProp = [[NodeProp.contextHash, hash]]
	}

	addChild(child: Tree, pos: number) {
		if (child.prop(NodeProp.contextHash) != this.hash)
			child = new Tree(child.type, child.children, child.positions, child.length, this.hashProp)
		this.children.push(child)
		this.positions.push(pos)
	}

	toTree(nodeSet: NodeSet, end = this.end) {
		const last = this.children.length - 1
		if (last >= 0)
			end = Math.max(end, this.positions[last] + this.children[last].length + this.from)
		return new Tree(nodeSet.types[this.type], this.children, this.positions, end - this.from).balance({
			makeTree: (children, positions, length) => new Tree(NodeType.none, children, positions, length, this.hashProp)
		})
	}
}

export enum Type {
	Document = 1,

	CodeBlock,
	FencedCode,
	Blockquote,
	BulletList,
	OrderedList,
	ListItem,
	ATXHeading1,
	ATXHeading2,
	ATXHeading3,
	ATXHeading4,
	ATXHeading5,
	ATXHeading6,
	Paragraph,

	// Inline
	Escape,
	Emphasis,
	StrongEmphasis,
	Underline,
	Strikethrough,
	InlineCode,
	Link,

	// Smaller tokens
	EscapeMark,
	HeaderMark,
	QuoteMark,
	ListMark,
	OrderedListMark,
	EmphasisMark,
	StrikethroughMark,
	CodeMark,
	CodeText,
	CodeInfo,
	LinkMark,
	URL
}

/// Data structure used to accumulate a block's content during [leaf
/// block parsing](#BlockParser.leaf).
export class LeafBlock {
/// @internal
	marks: Element[] = []
	/// The block parsers active for this block.
	parsers: LeafBlockParser[] = []

	/// @internal
	constructor(
		/// The start position of the block.
		readonly start: number,
		/// The block's text content.
		public content: string
	) {}
}

/// Data structure used during block-level per-line parsing.
export class Line {
/// The line's full text.
	text = ''
	/// The base indent provided by the composite contexts (that have
	/// been handled so far).
	baseIndent = 0
	/// The string position corresponding to the base indent.
	basePos = 0
	/// The number of contexts handled @internal
	depth = 0
	/// Any markers (i.e. block quote markers) parsed for the contexts. @internal
	markers: Element[] = []
	/// The position of the next non-whitespace character beyond any
	/// list, blockquote, or other composite block markers.
	pos = 0
	/// The column of the next non-whitespace character.
	indent = 0
	/// The character code of the character after `pos`.
	next = -1

	/// @internal
	forward() {
		if (this.basePos > this.pos)
			this.forwardInner()
	}

	/// @internal
	forwardInner() {
		const newPos = this.skipSpace(this.basePos)
		this.indent = this.countIndent(newPos, this.pos, this.indent)
		this.pos = newPos
		this.next = newPos == this.text.length ? -1 : this.text.charCodeAt(newPos)
	}

	/// Skip whitespace after the given position, return the position of
	/// the next non-space character or the end of the line if there's
	/// only space after `from`.
	skipSpace(from: number) {
		return skipSpace(this.text, from)
	}

	/// @internal
	reset(text: string) {
		this.text = text
		this.baseIndent = this.basePos = this.pos = this.indent = 0
		this.forwardInner()
		this.depth = 1
		while (this.markers.length) this.markers.pop()
	}

	/// Move the line's base position forward to the given position.
	/// This should only be called by composite [block
	/// parsers](#BlockParser.parse) or [markup skipping
	/// functions](#NodeSpec.composite).
	moveBase(to: number) {
		this.basePos = to
		this.baseIndent = this.countIndent(to, this.pos, this.indent)
	}

	/// Move the line's base position forward to the given _column_.
	moveBaseColumn(indent: number) {
		this.baseIndent = indent
		this.basePos = this.findColumn(indent)
	}

	/// Store a composite-block-level marker. Should be called from
	/// [markup skipping functions](#NodeSpec.composite) when they
	/// consume any non-whitespace characters.
	addMarker(elt: Element) {
		this.markers.push(elt)
	}

	/// Find the column position at `to`, optionally starting at a given
	/// position and column.
	countIndent(to: number, from = 0, indent = 0) {
		for (let i = from; i < to; i++)
			indent += this.text.charCodeAt(i) == 9 ? 4 - indent % 4 : 1
		return indent
	}

	/// Find the position corresponding to the given column.
	findColumn(goal: number) {
		let i = 0
		for (let indent = 0; i < this.text.length && indent < goal; i++)
			indent += this.text.charCodeAt(i) == 9 ? 4 - indent % 4 : 1
		return i
	}

	/// @internal
	scrub() {
		if (!this.baseIndent)
			return this.text
		let result = ''
		for (let i = 0; i < this.basePos; i++) result += ' '
		return result + this.text.slice(this.basePos)
	}
}

function skipForList(bl: CompositeBlock, cx: BlockContext, line: Line) {
	if (line.pos == line.text.length
		|| (bl != cx.block && line.indent >= cx.stack[line.depth + 1].value + line.baseIndent))
		return true
	if (line.indent >= line.baseIndent + 4)
		return false
	const size = (bl.type == Type.OrderedList ? isOrderedList : isBulletList)(line, cx, false)
	return size > 0
		&& (bl.type != Type.BulletList)
		&& line.text.charCodeAt(line.pos + size - 1) == bl.value
}

const DefaultSkipMarkup: { [type: number]: (bl: CompositeBlock, cx: BlockContext, line: Line) => boolean } = {
	[Type.Blockquote](bl, cx, line) {
		if (line.next != 62 /* '>' */)
			return false
		line.markers.push(elt(Type.QuoteMark, cx.lineStart + line.pos, cx.lineStart + line.pos + 1))
		line.moveBase(line.pos + (space(line.text.charCodeAt(line.pos + 1)) ? 2 : 1))
		bl.end = cx.lineStart + line.text.length
		return true
	},
	[Type.ListItem](bl, _cx, line) {
		if (line.indent < line.baseIndent + bl.value && line.next > -1)
			return false
		line.moveBaseColumn(line.baseIndent + bl.value)
		return true
	},
	[Type.OrderedList]: skipForList,
	[Type.BulletList]: skipForList,
	[Type.Document]() { return true }
}

export function space(ch: number) {
	return ch == 32 || ch == 9 || ch == 10 || ch == 13
}

function skipSpace(line: string, i = 0) {
	while (i < line.length && space(line.charCodeAt(i))) i++
	return i
}

function skipSpaceBack(line: string, i: number, to: number) {
	while (i > to && space(line.charCodeAt(i - 1))) i--
	return i
}

function isFencedCode(line: Line) {
	if (line.next != 96 /* ` */)
		return -1
	let pos = line.pos + 1
	while (pos < line.text.length && line.text.charCodeAt(pos) == line.next) pos++
	if (pos < line.pos + 3)
		return -1
	if (line.next == 96) {
		for (let i = pos; i < line.text.length; i++) {
			if (line.text.charCodeAt(i) == 96)
				return -1
		}
	}
	return pos
}

function isBlockquote(line: Line) {
	return line.next != 62 /* '>' */ ? -1 : line.text.charCodeAt(line.pos + 1) == 32 ? 2 : 1
}

function inList(cx: BlockContext, type: Type) {
	for (let i = cx.stack.length - 1; i >= 0; i--) {
		if (cx.stack[i].type == type)
			return true
	}
	return false
}

function isBulletList(line: Line, cx: BlockContext, breaking: boolean) {
	return (line.next == 45 || line.next == 42 /* '-*' */)
		&& (line.pos == line.text.length - 1 || space(line.text.charCodeAt(line.pos + 1)))
		&& (!breaking || inList(cx, Type.BulletList) || line.skipSpace(line.pos + 2) < line.text.length)
		? 1
		: -1
}

function isOrderedList(line: Line, cx: BlockContext, breaking: boolean) {
	let pos = line.pos
	let next = line.next
	for (;;) {
		if (next >= 48 && next <= 57 /* '0-9' */)
			pos++
		else break
		if (pos == line.text.length)
			return -1
		next = line.text.charCodeAt(pos)
	}
	if (
		pos == line.pos
		|| pos > line.pos + 9
		|| (next != 46 && next != 41 /* '.)' */)
		|| (pos < line.text.length - 1 && !space(line.text.charCodeAt(pos + 1)))
		|| (
			breaking
			&& !inList(cx, Type.OrderedList)
			&& (line.skipSpace(pos + 1) == line.text.length || pos > line.pos + 1 || line.next != 49 /* '1' */)
		)
	)
		return -1
	return pos + 1 - line.pos
}

function isAtxHeading(line: Line) {
	if (line.next !== 35 /* '#' */)
		return -1

	let pos = line.pos + 1

	while (pos < line.text.length && line.text.charCodeAt(pos) === 35)
		pos++

	if (pos <= line.text.length && line.text.charCodeAt(pos) !== 32)
		return -1

	const size = pos - line.pos

	return size > 6 ? -1 : size
}

function getListIndent(line: Line, pos: number) {
	const indentAfter = line.countIndent(pos, line.pos, line.indent)
	const indented = line.countIndent(line.skipSpace(pos), pos, indentAfter)
	return indented >= indentAfter + 5 ? indentAfter + 1 : indented
}

// Return type for block parsing functions. Can be either:
//
// - false to indicate that nothing was matched and lower-precedence
//   parsers should run.
//
// - true to indicate that a leaf block was parsed and the stream
//   was advanced past its content.
//
// - null to indicate that a context was opened and block parsing
//   should continue on this line.
type BlockResult = boolean | null

function addCodeText(marks: Element[], from: number, to: number) {
	const last = marks.length - 1

	if (last >= 0 && marks[last].to == from && marks[last].type == Type.CodeText)
		(marks[last] as any).to = to

	else marks.push(elt(Type.CodeText, from, to))
}

// Rules for parsing blocks. A return value of false means the rule
// doesn't apply here, true means it does. When true is returned and
// `p.line` has been updated, the rule is assumed to have consumed a
// leaf block. Otherwise, it is assumed to have opened a context.
const DefaultBlockParsers: { [name: string]: ((cx: BlockContext, line: Line) => BlockResult) | undefined } = {
	FencedCode(cx, line) {
		if (cx.block.type == Type.Blockquote)
			return false

		const fenceEnd = isFencedCode(line)

		if (fenceEnd < 0)
			return false

		const from = cx.lineStart + line.pos
		const ch = line.next
		const len = fenceEnd - line.pos
		const infoFrom = line.skipSpace(fenceEnd)
		const infoTo = skipSpaceBack(line.text, line.text.length, infoFrom)
		const marks: (Element | TreeElement)[] = [elt(Type.CodeMark, from, from + len)]

		if (infoFrom < infoTo)
			marks.push(elt(Type.CodeInfo, cx.lineStart + infoFrom, cx.lineStart + infoTo))

		for (let first = true; cx.nextLine() && line.depth >= cx.stack.length; first = false) {
			let i = line.pos

			if (line.indent - line.baseIndent < 4)
				while (i < line.text.length && line.text.charCodeAt(i) == ch)
					i++

			if (i - line.pos >= len && line.skipSpace(i) == line.text.length) {
				for (const m of line.markers)
					marks.push(m)

				marks.push(elt(Type.CodeMark, cx.lineStart + line.pos, cx.lineStart + i))
				cx.nextLine()

				break
			} else {
				if (!first)
					addCodeText(marks, cx.lineStart - 1, cx.lineStart)

				for (const m of line.markers)
					marks.push(m)

				const textStart = cx.lineStart + line.basePos
				const textEnd = cx.lineStart + line.text.length

				if (textStart < textEnd)
					addCodeText(marks, cx.lineStart, textEnd)
			}
		}

		cx.addNode(cx.buffer.writeElements(marks, -from)
			.finish(Type.FencedCode, cx.prevLineEnd() - from), from)

		return true
	},

	Blockquote(cx, line) {
		const size = isBlockquote(line)
		if (size < 0)
			return false
		cx.startContext(Type.Blockquote, line.pos)
		cx.addNode(Type.QuoteMark, cx.lineStart + line.pos, cx.lineStart + line.pos + 1)
		line.moveBase(line.pos + size)
		return null
	},

	BulletList(cx, line) {
		const size = isBulletList(line, cx, false)
		if (size < 0)
			return false
		if (cx.block.type != Type.BulletList)
			cx.startContext(Type.BulletList, line.basePos, line.next)
		const newBase = getListIndent(line, line.pos + 1)
		cx.startContext(Type.ListItem, line.basePos, newBase - line.baseIndent)
		cx.addNode(Type.ListMark, cx.lineStart + line.pos, cx.lineStart + line.pos + size)
		line.moveBaseColumn(newBase)
		return null
	},

	OrderedList(cx, line) {
		const size = isOrderedList(line, cx, false)
		if (size < 0)
			return false
		if (cx.block.type != Type.OrderedList)
			cx.startContext(Type.OrderedList, line.basePos, line.text.charCodeAt(line.pos + size - 1))
		const newBase = getListIndent(line, line.pos + size)
		cx.startContext(Type.ListItem, line.basePos, newBase - line.baseIndent)
		cx.addNode(Type.OrderedListMark, cx.lineStart + line.pos, cx.lineStart + line.pos + size)
		line.moveBaseColumn(newBase)
		return null
	},

	ATXHeading(cx, line) {
		const size = isAtxHeading(line)
		if (size < 0)
			return false
		const off = line.pos
		const from = cx.lineStart + off
		const endOfSpace = skipSpaceBack(line.text, line.text.length, off)
		let after = endOfSpace
		while (after > off && line.text.charCodeAt(after - 1) == line.next) after--
		if (after == endOfSpace || after == off || !space(line.text.charCodeAt(after - 1)))
			after = line.text.length
		const buf = cx.buffer
			.write(Type.HeaderMark, 0, size)
			.writeElements(cx.parser.parseInline(line.text.slice(off + size + 1, after), from + size + 1), -from)
		if (after < line.text.length)
			buf.write(Type.HeaderMark, after - off, endOfSpace - off)
		const node = buf.finish(Type.ATXHeading1 - 1 + size, line.text.length - off)
		cx.nextLine()
		cx.addNode(node, from)
		return true
	}
}

const DefaultLeafBlocks: { [name: string]: (cx: BlockContext, leaf: LeafBlock) => LeafBlockParser | null } = {
}

const DefaultEndLeaf: readonly ((cx: BlockContext, line: Line) => boolean)[] = [
	(_, line) => isAtxHeading(line) >= 0,
	(_, line) => isFencedCode(line) >= 0,
	(_, line) => isBlockquote(line) >= 0,
	(p, line) => isBulletList(line, p, true) >= 0,
	(p, line) => isOrderedList(line, p, true) >= 0
]

const scanLineResult = { text: '', end: 0 }

/// Block-level parsing functions get access to this context object.
export class BlockContext implements PartialParse {
/// @internal
	block: CompositeBlock
	/// @internal
	stack: CompositeBlock[]
	private line = new Line()
	private atEnd = false
	private fragments: FragmentCursor | null
	private to: number
	/// For reused nodes on gaps, we can't directly put the original
	/// node into the tree, since that may be bitter than its parent.
	/// When this happens, we create a dummy tree that is replaced by
	/// the proper node in `injectGaps` @internal
	reusePlaceholders: Map<Tree, Tree> = new Map()
	stoppedAt: number | null = null

	/// The start of the current line.
	lineStart: number
	/// The absolute (non-gap-adjusted) position of the line @internal
	absoluteLineStart: number
	/// The range index that absoluteLineStart points into @internal
	rangeI = 0
	/// @internal
	absoluteLineEnd: number

	/// @internal
	constructor(
		/// The parser configuration used.
		readonly parser: MarkdownParser,
		/// @internal
		readonly input: Input,
		fragments: readonly TreeFragment[],
		/// @internal
		readonly ranges: readonly { from: number, to: number }[]
	) {
		this.to = ranges[ranges.length - 1].to
		this.lineStart = this.absoluteLineStart = this.absoluteLineEnd = ranges[0].from
		this.block = CompositeBlock.create(Type.Document, 0, this.lineStart, 0, 0)
		this.stack = [this.block]
		this.fragments = fragments.length ? new FragmentCursor(fragments, input) : null
		this.readLine()
	}

	get parsedPos() {
		return this.absoluteLineStart
	}

	advance() {
		if (this.stoppedAt != null && this.absoluteLineStart > this.stoppedAt)
			return this.finish()

		const { line } = this
		for (;;) {
			for (let markI = 0; ;) {
				const next = line.depth < this.stack.length ? this.stack[this.stack.length - 1] : null
				while (markI < line.markers.length && (!next || line.markers[markI].from < next.end)) {
					const mark = line.markers[markI++]
					this.addNode(mark.type, mark.from, mark.to)
				}
				if (!next)
					break
				this.finishContext()
			}
			if (line.pos < line.text.length)
				break
			// Empty line
			if (!this.nextLine())
				return this.finish()
		}

		if (this.fragments && this.reuseFragment(line.basePos))
			return null

		start: for (;;) {
			for (const type of this.parser.blockParsers) {
				if (type) {
					const result = type(this, line)
					if (result != false) {
						if (result == true)
							return null
						line.forward()
						continue start
					}
				}
			}
			break
		}

		const leaf = new LeafBlock(this.lineStart + line.pos, line.text.slice(line.pos))
		for (const parse of this.parser.leafBlockParsers) {
			if (parse) {
				const parser = parse!(this, leaf)
				if (parser)
					leaf.parsers.push(parser!)
			}
		}
		lines: while (this.nextLine()) {
			if (line.pos == line.text.length)
				break
			if (line.indent < line.baseIndent + 4) {
				for (const stop of this.parser.endLeafBlock) {
					if (stop(this, line, leaf))
						break lines
				}
			}

			for (const parser of leaf.parsers) {
				if (parser.nextLine(this, line, leaf))
					return null
			}
			leaf.content += `\n${line.scrub()}`
			for (const m of line.markers) leaf.marks.push(m)
		}
		this.finishLeaf(leaf)
		return null
	}

	stopAt(pos: number) {
		if (this.stoppedAt != null && this.stoppedAt < pos)
			throw new RangeError('Can\'t move stoppedAt forward')
		this.stoppedAt = pos
	}

	private reuseFragment(start: number) {
		if (!this.fragments!.moveTo(this.absoluteLineStart + start, this.absoluteLineStart)
			|| !this.fragments!.matches(this.block.hash))
			return false
		const taken = this.fragments!.takeNodes(this)
		if (!taken)
			return false
		this.absoluteLineStart += taken
		this.lineStart = toRelative(this.absoluteLineStart, this.ranges)
		this.moveRangeI()
		if (this.absoluteLineStart < this.to) {
			this.lineStart++
			this.absoluteLineStart++
			this.readLine()
		} else {
			this.atEnd = true
			this.readLine()
		}
		return true
	}

	/// The number of parent blocks surrounding the current block.
	get depth() {
		return this.stack.length
	}

	/// Get the type of the parent block at the given depth. When no
	/// depth is passed, return the type of the innermost parent.
	parentType(depth = this.depth - 1) {
		return this.parser.nodeSet.types[this.stack[depth].type]
	}

	/// Move to the next input line. This should only be called by
	/// (non-composite) [block parsers](#BlockParser.parse) that consume
	/// the line directly, or leaf block parser
	/// [`nextLine`](#LeafBlockParser.nextLine) methods when they
	/// consume the current line (and return true).
	nextLine() {
		this.lineStart += this.line.text.length
		if (this.absoluteLineEnd >= this.to) {
			this.absoluteLineStart = this.absoluteLineEnd
			this.atEnd = true
			this.readLine()
			return false
		} else {
			this.lineStart++
			this.absoluteLineStart = this.absoluteLineEnd + 1
			this.moveRangeI()
			this.readLine()
			return true
		}
	}

	private moveRangeI() {
		while (this.rangeI < this.ranges.length - 1 && this.absoluteLineStart >= this.ranges[this.rangeI].to) {
			this.rangeI++
			this.absoluteLineStart = Math.max(this.absoluteLineStart, this.ranges[this.rangeI].from)
		}
	}

	/// @internal
	scanLine(start: number) {
		const r = scanLineResult
		r.end = start
		if (start >= this.to)
			r.text = ''
		else {
			r.text = this.lineChunkAt(start)
			r.end += r.text.length
			if (this.ranges.length > 1) {
				let textOffset = this.absoluteLineStart
				let rangeI = this.rangeI
				while (this.ranges[rangeI].to < r.end) {
					rangeI++
					const nextFrom = this.ranges[rangeI].from
					const after = this.lineChunkAt(nextFrom)
					r.end = nextFrom + after.length
					r.text = r.text.slice(0, this.ranges[rangeI - 1].to - textOffset) + after
					textOffset = r.end - r.text.length
				}
			}
		}
		return r
	}

	/// @internal
	readLine() {
		const { line } = this
		const { text, end } = this.scanLine(this.absoluteLineStart)
		this.absoluteLineEnd = end
		line.reset(text)
		for (; line.depth < this.stack.length; line.depth++) {
			const cx = this.stack[line.depth]
			const handler = this.parser.skipContextMarkup[cx.type]
			if (!handler)
				throw new Error(`Unhandled block context ${Type[cx.type]}`)
			if (!handler(cx, this, line))
				break
			line.forward()
		}
	}

	private lineChunkAt(pos: number) {
		const next = this.input.chunk(pos)
		let text
		if (!this.input.lineChunks) {
			const eol = next.indexOf('\n')
			text = eol < 0 ? next : next.slice(0, eol)
		} else
			text = next == '\n' ? '' : next

		return pos + text.length > this.to ? text.slice(0, this.to - pos) : text
	}

	/// The end position of the previous line.
	prevLineEnd() { return this.atEnd ? this.lineStart : this.lineStart - 1 }

	/// @internal
	startContext(type: Type, start: number, value = 0) {
		this.block = CompositeBlock.create(type, value, this.lineStart + start, this.block.hash, this.lineStart + this.line.text.length)
		this.stack.push(this.block)
	}

	/// Start a composite block. Should only be called from [block
	/// parser functions](#BlockParser.parse) that return null.
	startComposite(type: string, start: number, value = 0) {
		this.startContext(this.parser.getNodeType(type), start, value)
	}

	/// @internal
	addNode(block: Type | Tree, from: number, to?: number) {
		if (typeof block == 'number')
			block = new Tree(this.parser.nodeSet.types[block], none, none, (to ?? this.prevLineEnd()) - from)
		this.block.addChild(block, from - this.block.from)
	}

	/// Add a block element. Can be called by [block
	/// parsers](#BlockParser.parse).
	addElement(elt: Element) {
		this.block.addChild(elt.toTree(this.parser.nodeSet), elt.from - this.block.from)
	}

	/// Add a block element from a [leaf parser](#LeafBlockParser). This
	/// makes sure any extra composite block markup (such as blockquote
	/// markers) inside the block are also added to the syntax tree.
	addLeafElement(leaf: LeafBlock, elt: Element) {
		this.addNode(this.buffer
			.writeElements(injectMarks(elt.children, leaf.marks), -elt.from)
			.finish(elt.type, elt.to - elt.from), elt.from)
	}

	/// @internal
	finishContext() {
		const cx = this.stack.pop()!
		const top = this.stack[this.stack.length - 1]
		top.addChild(cx.toTree(this.parser.nodeSet), cx.from - top.from)
		this.block = top
	}

	private finish() {
		while (this.stack.length > 1) this.finishContext()
		return this.addGaps(this.block.toTree(this.parser.nodeSet, this.lineStart))
	}

	private addGaps(tree: Tree) {
		return this.ranges.length > 1
			? injectGaps(this.ranges, 0, tree.topNode, this.ranges[0].from, this.reusePlaceholders)
			: tree
	}

	/// @internal
	finishLeaf(leaf: LeafBlock) {
		for (const parser of leaf.parsers) {
			if (parser.finish(this, leaf))
				return
		}
		const inline = injectMarks(this.parser.parseInline(leaf.content, leaf.start), leaf.marks)
		this.addNode(this.buffer
			.writeElements(inline, -leaf.start)
			.finish(Type.Paragraph, leaf.content.length), leaf.start)
	}

	/// Create an [`Element`](#Element) object to represent some syntax
	/// node.
	elt(type: string, from: number, to: number, children?: readonly Element[]): Element
	elt(tree: Tree, at: number): Element
	elt(type: string | Tree, from: number, to?: number, children?: readonly Element[]): Element {
		if (typeof type == 'string')
			return elt(this.parser.getNodeType(type), from, to!, children)
		return new TreeElement(type, from)
	}

	/// @internal
	get buffer() { return new Buffer(this.parser.nodeSet) }
}

function injectGaps(
	ranges: readonly { from: number, to: number }[],
	rangeI: number,
	tree: SyntaxNode,
	offset: number,
	dummies: Map<Tree, Tree>
): Tree {
	let rangeEnd = ranges[rangeI].to
	const children = []
	const positions = []
	const start = tree.from + offset
	function movePastNext(upto: number, inclusive: boolean) {
		while (inclusive ? upto >= rangeEnd : upto > rangeEnd) {
			const size = ranges[rangeI + 1].from - rangeEnd
			offset += size
			upto += size
			rangeI++
			rangeEnd = ranges[rangeI].to
		}
	}
	for (let ch = tree.firstChild; ch; ch = ch.nextSibling) {
		movePastNext(ch.from + offset, true)
		const from = ch.from + offset
		let node
		const reuse = dummies.get(ch.tree!)
		if (reuse)
			node = reuse
		else if (ch.to + offset > rangeEnd) {
			node = injectGaps(ranges, rangeI, ch, offset, dummies)
			movePastNext(ch.to + offset, false)
		} else
			node = ch.toTree()

		children.push(node)
		positions.push(from - start)
	}
	movePastNext(tree.to + offset, false)
	return new Tree(tree.type, children, positions, tree.to + offset - start, tree.tree ? tree.tree.propValues : undefined)
}

/// Used in the [configuration](#MarkdownConfig.defineNodes) to define
/// new [syntax node
/// types](https://lezer.codemirror.net/docs/ref/#common.NodeType).
export interface NodeSpec {
/// The node's name.
	name: string
	/// Should be set to true if this type represents a block node.
	block?: boolean
	/// If this is a composite block, this should hold a function that,
	/// at the start of a new line where that block is active, checks
	/// whether the composite block should continue (return value) and
	/// optionally [adjusts](#Line.moveBase) the line's base position
	/// and [registers](#Line.addMarker) nodes for any markers involved
	/// in the block's syntax.
	composite?: (cx: BlockContext, line: Line, value: number) => boolean
	/// Add highlighting tag information for this node. The value of
	/// this property may either by a tag or array of tags to assign
	/// directly to this node, or an object in the style of
	/// [`styleTags`](https://lezer.codemirror.net/docs/ref/#highlight.styleTags)'s
	/// argument to assign more complicated rules.
	style?: Tag | readonly Tag[] | { [selector: string]: Tag | readonly Tag[] }
}

/// Inline parsers are called for every character of parts of the
/// document that are parsed as inline content.
export interface InlineParser {
/// This parser's name, which can be used by other parsers to
/// [indicate](#InlineParser.before) a relative precedence.
	name: string
	/// The parse function. Gets the next character and its position as
	/// arguments. Should return -1 if it doesn't handle the character,
	/// or add some [element](#InlineContext.addElement) or
	/// [delimiter](#InlineContext.addDelimiter) and return the end
	/// position of the content it parsed if it can.
	parse: (cx: InlineContext, next: number, pos: number) => number
	/// When given, this parser will be installed directly before the
	/// parser with the given name. The default configuration defines
	/// inline parsers with names Escape, Entity, InlineCode, HTMLTag,
	/// Emphasis, HardBreak, Link, and Image. When no `before` or
	/// `after` property is given, the parser is added to the end of the
	/// list.
	before?: string
	/// When given, the parser will be installed directly _after_ the
	/// parser with the given name.
	after?: string
}

/// Block parsers handle block-level structure. There are three
/// general types of block parsers:
///
/// - Composite block parsers, which handle things like lists and
///   blockquotes. These define a [`parse`](#BlockParser.parse) method
///   that [starts](#BlockContext.startComposite) a composite block
///   and returns null when it recognizes its syntax.
///
/// - Eager leaf block parsers, used for things like code or HTML
///   blocks. These can unambiguously recognize their content from its
///   first line. They define a [`parse`](#BlockParser.parse) method
///   that, if it recognizes the construct,
///   [moves](#BlockContext.nextLine) the current line forward to the
///   line beyond the end of the block,
///   [add](#BlockContext.addElement) a syntax node for the block, and
///   return true.
///
/// - Leaf block parsers that observe a paragraph-like construct as it
///   comes in, and optionally decide to handle it at some point. This
///   is used for "setext" (underlined) headings and link references.
///   These define a [`leaf`](#BlockParser.leaf) method that checks
///   the first line of the block and returns a
///   [`LeafBlockParser`](#LeafBlockParser) object if it wants to
///   observe that block.
export interface BlockParser {
/// The name of the parser. Can be used by other block parsers to
/// [specify](#BlockParser.before) precedence.
	name: string
	/// The eager parse function, which can look at the block's first
	/// line and return `false` to do nothing, `true` if it has parsed
	/// (and [moved past](#BlockContext.nextLine) a block), or `null` if
	/// it has started a composite block.
	parse?: (cx: BlockContext, line: Line) => BlockResult
	/// A leaf parse function. If no [regular](#BlockParser.parse) parse
	/// functions match for a given line, its content will be
	/// accumulated for a paragraph-style block. This method can return
	/// an [object](#LeafBlockParser) that overrides that style of
	/// parsing in some situations.
	leaf?: (cx: BlockContext, leaf: LeafBlock) => LeafBlockParser | null
	/// Some constructs, such as code blocks or newly started
	/// blockquotes, can interrupt paragraphs even without a blank line.
	/// If your construct can do this, provide a predicate here that
	/// recognizes lines that should end a paragraph (or other non-eager
	/// [leaf block](#BlockParser.leaf)).
	endLeaf?: (cx: BlockContext, line: Line, leaf: LeafBlock) => boolean
	/// When given, this parser will be installed directly before the
	/// block parser with the given name. The default configuration
	/// defines block parsers with names LinkReference, IndentedCode,
	/// FencedCode, Blockquote, HorizontalRule, BulletList, OrderedList,
	/// ATXHeading, HTMLBlock.
	before?: string
	/// When given, the parser will be installed directly _after_ the
	/// parser with the given name.
	after?: string
}

/// Objects that are used to [override](#BlockParser.leaf)
/// paragraph-style blocks should conform to this interface.
export interface LeafBlockParser {
/// Update the parser's state for the next line, and optionally
/// finish the block. This is not called for the first line (the
/// object is contructed at that line), but for any further lines.
/// When it returns `true`, the block is finished. It is okay for
/// the function to [consume](#BlockContext.nextLine) the current
/// line or any subsequent lines when returning true.
	nextLine: (cx: BlockContext, line: Line, leaf: LeafBlock) => boolean
	/// Called when the block is finished by external circumstances
	/// (such as a blank line or the [start](#BlockParser.endLeaf) of
	/// another construct). If this parser can handle the block up to
	/// its current position, it should
	/// [finish](#BlockContext.addLeafElement) the block and return
	/// true.
	finish: (cx: BlockContext, leaf: LeafBlock) => boolean
}

/// Objects of this type are used to
/// [configure](#MarkdownParser.configure) the Markdown parser.
export interface MarkdownConfig {
/// Node props to add to the parser's node set.
	props?: readonly NodePropSource[]
	/// Define new [node types](#NodeSpec) for use in parser extensions.
	defineNodes?: readonly (string | NodeSpec)[]
	/// Define additional [block parsing](#BlockParser) logic.
	parseBlock?: readonly BlockParser[]
	/// Define new [inline parsing](#InlineParser) logic.
	parseInline?: readonly InlineParser[]
	/// Remove the named parsers from the configuration.
	remove?: readonly string[]
	/// Add a parse wrapper (such as a [mixed-language
	/// parser](#common.parseMixed)) to this parser.
	wrap?: ParseWrapper
}

/// To make it possible to group extensions together into bigger
/// extensions (such as the [Github-flavored Markdown](#GFM)
/// extension), [reconfiguration](#MarkdownParser.configure) accepts
/// nested arrays of [config](#MarkdownConfig) objects.
export type MarkdownExtension = MarkdownConfig | readonly MarkdownExtension[]

/// A Markdown parser configuration.
export class MarkdownParser extends Parser {
/// @internal
	nodeTypes: { [name: string]: number } = Object.create(null)

	/// @internal
	constructor(
		/// The parser's syntax [node
		/// types](https://lezer.codemirror.net/docs/ref/#common.NodeSet).
		readonly nodeSet: NodeSet,
		/// @internal
		readonly blockParsers: readonly (((cx: BlockContext, line: Line) => BlockResult) | undefined)[],
		/// @internal
		readonly leafBlockParsers: readonly (((cx: BlockContext, leaf: LeafBlock) => LeafBlockParser | null) | undefined)[],
		/// @internal
		readonly blockNames: readonly string[],
		/// @internal
		readonly endLeafBlock: readonly ((cx: BlockContext, line: Line, leaf: LeafBlock) => boolean)[],
		/// @internal
		readonly skipContextMarkup: { readonly [type: number]: (bl: CompositeBlock, cx: BlockContext, line: Line) => boolean },
		/// @internal
		readonly inlineParsers: readonly (((cx: InlineContext, next: number, pos: number) => number) | undefined)[],
		/// @internal
		readonly inlineNames: readonly string[],
		/// @internal
		readonly wrappers: readonly ParseWrapper[]
	) {
		super()
		for (const t of nodeSet.types) this.nodeTypes[t.name] = t.id
	}

	createParse(input: Input, fragments: readonly TreeFragment[], ranges: readonly { from: number, to: number }[]): PartialParse {
		let parse: PartialParse = new BlockContext(this, input, fragments, ranges)
		for (const w of this.wrappers) parse = w(parse, input, fragments, ranges)
		return parse
	}

	/// Reconfigure the parser.
	configure(spec: MarkdownExtension) {
		const config = resolveConfig(spec)
		if (!config)
			return this
		let { nodeSet, skipContextMarkup } = this
		const blockParsers = this.blockParsers.slice()
		const leafBlockParsers = this.leafBlockParsers.slice()
		const blockNames = this.blockNames.slice()
		const inlineParsers = this.inlineParsers.slice()
		const inlineNames = this.inlineNames.slice()
		const endLeafBlock = this.endLeafBlock.slice()
		let wrappers = this.wrappers

		if (nonEmpty(config.defineNodes)) {
			skipContextMarkup = Object.assign({}, skipContextMarkup)
			const nodeTypes = nodeSet.types.slice()
			let styles: { [selector: string]: Tag | readonly Tag[] } | undefined
			for (const s of config.defineNodes) {
				const { name, block, composite, style } = typeof s == 'string' ? { name: s } as NodeSpec : s
				if (nodeTypes.some(t => t.name == name))
					continue
				if (composite) {
					(skipContextMarkup as any)[nodeTypes.length]
		= (bl: CompositeBlock, cx: BlockContext, line: Line) => composite!(cx, line, bl.value)
				}
				const id = nodeTypes.length
				const group = composite
					? ['Block', 'BlockContext']
					: !block
							? undefined
							: id >= Type.ATXHeading1 ? ['Block', 'LeafBlock', 'Heading'] : ['Block', 'LeafBlock']
				nodeTypes.push(NodeType.define({
					id,
					name,
					props: group && [[NodeProp.group, group]]
				}))
				if (style) {
					if (!styles)
						styles = {}
					if (Array.isArray(style) || style instanceof Tag)
						styles[name] = style
					else Object.assign(styles, style)
				}
			}
			nodeSet = new NodeSet(nodeTypes)
			if (styles)
				nodeSet = nodeSet.extend(styleTags(styles))
		}

		if (nonEmpty(config.props))
			nodeSet = nodeSet.extend(...config.props)

		if (nonEmpty(config.remove)) {
			for (const rm of config.remove) {
				const block = this.blockNames.indexOf(rm)
				const inline = this.inlineNames.indexOf(rm)
				if (block > -1)
					blockParsers[block] = leafBlockParsers[block] = undefined
				if (inline > -1)
					inlineParsers[inline] = undefined
			}
		}

		if (nonEmpty(config.parseBlock)) {
			for (const spec of config.parseBlock) {
				const found = blockNames.indexOf(spec.name)
				if (found > -1) {
					blockParsers[found] = spec.parse
					leafBlockParsers[found] = spec.leaf
				} else {
					const pos = spec.before
						? findName(blockNames, spec.before)
						: spec.after ? findName(blockNames, spec.after) + 1 : blockNames.length - 1
					blockParsers.splice(pos, 0, spec.parse)
					leafBlockParsers.splice(pos, 0, spec.leaf)
					blockNames.splice(pos, 0, spec.name)
				}
				if (spec.endLeaf)
					endLeafBlock.push(spec.endLeaf)
			}
		}

		if (nonEmpty(config.parseInline)) {
			for (const spec of config.parseInline) {
				const found = inlineNames.indexOf(spec.name)
				if (found > -1)
					inlineParsers[found] = spec.parse
				else {
					const pos = spec.before
						? findName(inlineNames, spec.before)
						: spec.after ? findName(inlineNames, spec.after) + 1 : inlineNames.length - 1
					inlineParsers.splice(pos, 0, spec.parse)
					inlineNames.splice(pos, 0, spec.name)
				}
			}
		}

		if (config.wrap)
			wrappers = wrappers.concat(config.wrap)

		return new MarkdownParser(nodeSet, blockParsers, leafBlockParsers, blockNames, endLeafBlock, skipContextMarkup, inlineParsers, inlineNames, wrappers)
	}

	/// @internal
	getNodeType(name: string) {
		const found = this.nodeTypes[name]
		if (found == null)
			throw new RangeError(`Unknown node type '${name}'`)
		return found
	}

	/// Parse the given piece of inline text at the given offset,
	/// returning an array of [`Element`](#Element) objects representing
	/// the inline content.
	parseInline(text: string, offset: number) {
		const cx = new InlineContext(this, text, offset)
		outer: for (let pos = offset; pos < cx.end;) {
			const next = cx.char(pos)
			for (const token of this.inlineParsers) {
				if (token) {
					const result = token(cx, next, pos)
					if (result >= 0) {
						pos = result
						continue outer
					}
				}
			}
			pos++
		}
		return cx.resolveMarkers(0)
	}
}

function nonEmpty<T>(a: undefined | readonly T[]): a is readonly T[] {
	return a != null && a.length > 0
}

function resolveConfig(spec: MarkdownExtension): MarkdownConfig | null {
	if (!Array.isArray(spec))
		return spec as MarkdownConfig
	if (spec.length == 0)
		return null
	const conf = resolveConfig(spec[0])
	if (spec.length == 1)
		return conf
	const rest = resolveConfig(spec.slice(1))
	if (!rest || !conf)
		return conf || rest
	const conc: <T>(a: readonly T[] | undefined, b: readonly T[] | undefined) => readonly T[]
= (a, b) => (a || none).concat(b || none)
	const wrapA = conf.wrap
	const wrapB = rest.wrap
	return {
		props: conc(conf.props, rest.props),
		defineNodes: conc(conf.defineNodes, rest.defineNodes),
		parseBlock: conc(conf.parseBlock, rest.parseBlock),
		parseInline: conc(conf.parseInline, rest.parseInline),
		remove: conc(conf.remove, rest.remove),
		wrap: !wrapA
			? wrapB
			: !wrapB
					? wrapA
					: (inner, input, fragments, ranges) => wrapA!(wrapB!(inner, input, fragments, ranges), input, fragments, ranges)
	}
}

function findName(names: readonly string[], name: string) {
	const found = names.indexOf(name)
	if (found < 0)
		throw new RangeError(`Position specified relative to unknown parser ${name}`)
	return found
}

const nodeTypes = [NodeType.none]

for (let i = 1, name; name = Type[i]; i++) {
	nodeTypes[i] = NodeType.define({
		id: i,
		name,
		props: i >= Type.Escape ? [] : [[NodeProp.group, i in DefaultSkipMarkup ? ['Block', 'BlockContext'] : ['Block', 'LeafBlock']]],
		top: name == 'Document'
	})
}

const none: readonly any[] = []

class Buffer {
	content: number[] = []
	nodes: Tree[] = []
	constructor(readonly nodeSet: NodeSet) {}

	write(type: Type, from: number, to: number, children = 0) {
		this.content.push(type, from, to, 4 + children * 4)
		return this
	}

	writeElements(elts: readonly (Element | TreeElement)[], offset = 0) {
		for (const e of elts) e.writeTo(this, offset)
		return this
	}

	finish(type: Type, length: number) {
		return Tree.build({
			buffer: this.content,
			nodeSet: this.nodeSet,
			reused: this.nodes,
			topID: type,
			length
		})
	}
}

/// Elements are used to compose syntax nodes during parsing.
export class Element {
/// @internal
	constructor(
		/// The node's
		/// [id](https://lezer.codemirror.net/docs/ref/#common.NodeType.id).
		readonly type: number,
		/// The start of the node, as an offset from the start of the document.
		readonly from: number,
		/// The end of the node.
		readonly to: number,
		/// The node's child nodes @internal
		readonly children: readonly (Element | TreeElement)[] = none
	) {}

	/// @internal
	writeTo(buf: Buffer, offset: number) {
		const startOff = buf.content.length
		buf.writeElements(this.children, offset)
		buf.content.push(this.type, this.from + offset, this.to + offset, buf.content.length + 4 - startOff)
	}

	/// @internal
	toTree(nodeSet: NodeSet): Tree {
		return new Buffer(nodeSet).writeElements(this.children, -this.from).finish(this.type, this.to - this.from)
	}
}

class TreeElement {
	constructor(readonly tree: Tree, readonly from: number) {}

	get to() { return this.from + this.tree.length }

	get type() { return this.tree.type.id }

	get children() { return none }

	writeTo(buf: Buffer, offset: number) {
		buf.nodes.push(this.tree)
		buf.content.push(buf.nodes.length - 1, this.from + offset, this.to + offset, -1)
	}

	toTree(): Tree { return this.tree }
}

function elt(type: Type, from: number, to: number, children?: readonly (Element | TreeElement)[]) {
	return new Element(type, from, to, children)
}

const enum Mark { None = 0, Open = 1, Close = 2 }

/// Delimiters are used during inline parsing to store the positions
/// of things that _might_ be delimiters, if another matching
/// delimiter is found. They are identified by objects with these
/// properties.
export interface DelimiterType {
/// If this is given, the delimiter should be matched automatically
/// when a piece of inline content is finished. Such delimiters will
/// be matched with delimiters of the same type according to their
/// [open and close](#InlineContext.addDelimiter) properties. When a
/// match is found, the content between the delimiters is wrapped in
/// a node whose name is given by the value of this property.
///
/// When this isn't given, you need to match the delimiter eagerly
/// using the [`findOpeningDelimiter`](#InlineContext.findOpeningDelimiter)
/// and [`takeContent`](#InlineContext.takeContent) methods.
	resolve?: string
	/// If the delimiter itself should, when matched, create a syntax
	/// node, set this to the name of the syntax node.
	mark?: string
}

const EmphasisUnderscore: DelimiterType = { resolve: 'Emphasis', mark: 'EmphasisMark' }
const EmphasisAsterisk: DelimiterType = { resolve: 'Emphasis', mark: 'EmphasisMark' }
const Strikethrough: DelimiterType = { resolve: 'Strikethrough', mark: 'StrikethroughMark' }

class InlineDelimiter {
	constructor(readonly type: DelimiterType, readonly from: number, readonly to: number, public side: Mark) {}
}

const Escapable = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'

let PunctuationRegex = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~\xA1\u2010-\u2027]/
try {
	PunctuationRegex = new RegExp('[\\p{Pc}|\\p{Pd}\\p{Pe}\\p{Pf}\\p{Pi}\\p{Po}\\p{Ps}]', 'u')
} catch {}

export const Punctuation = PunctuationRegex

const DefaultInline: { [name: string]: (cx: InlineContext, next: number, pos: number) => number } = {
	Escape(cx, next, start) {
		if (next != 92 /* '\\' */ || start == cx.end - 1)
			return -1

		const escaped = cx.char(start + 1)

		for (let i = 0; i < Escapable.length; i++) {
			if (Escapable.charCodeAt(i) == escaped)
				return cx.append(elt(Type.Escape, start, start + 2, [elt(Type.EscapeMark, start, start + 1)]))
		}
		return -1
	},

	Emphasis(cx, next, start) {
		if (![95, 42, 126].includes(next))
			return -1

		let pos = start + 1

		while (cx.char(pos) == next)
			pos++

		const before = cx.slice(start - 1, start)
		const after = cx.slice(pos, pos + 1)

		const punctuationBefore = Punctuation.test(before)
		const punctuationAfter = Punctuation.test(after)
		const spaceBefore = /\s|^$/.test(before)
		const spaceAfter = /\s|^$/.test(after)

		const leftFlanking = !spaceAfter && (!punctuationAfter || spaceBefore || punctuationBefore)
		const rightFlanking = !spaceBefore && (!punctuationBefore || spaceAfter || punctuationAfter)

		// Originally, intraword strong emphasis is forbidden with __
		// It is allowed anyways because it serves as underline instead of strong emphasis in this implementation
		const canOpen = leftFlanking && ([42, 126].includes(next) || cx.char(start + 1) == 95 || !rightFlanking || punctuationBefore)
		const canClose = rightFlanking && ([42, 126].includes(next) || cx.char(start + 1) == 95 || !leftFlanking || punctuationAfter)

		return cx.append(new InlineDelimiter(
			next == 95 ? EmphasisUnderscore : next == 42 ? EmphasisAsterisk : Strikethrough,
			start,
			pos,
			(canOpen ? Mark.Open : Mark.None) | (canClose ? Mark.Close : Mark.None)))
	},

	URL(cx, next, start) {
		if (next != 60 /* '<' */ || start == cx.end - 1)
			return -1

		const after = cx.slice(start + 1, cx.end)
		const url = /^(?:[a-z][-\w+.]+:[^\s>]+|[a-z\d.!#$%&'*+/=?^_`{|}~-]+@[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)*)>/i.exec(after)

		if (!url)
			return -1

		return cx.append(elt(Type.Link, start, start + 1 + url[0].length, [
			elt(Type.LinkMark, start, start + 1),
			elt(Type.URL, start + 1, start + url[0].length),
			elt(Type.LinkMark, start + url[0].length, start + 1 + url[0].length)
		]))
	},

	InlineCode(cx, next, start) {
		if (next != 96 /* '`' */ || (start && cx.char(start - 1) == 96))
			return -1
		let pos = start + 1
		while (pos < cx.end && cx.char(pos) == 96) pos++
		const size = pos - start
		let curSize = 0
		for (; pos < cx.end; pos++) {
			if (cx.char(pos) == 96) {
				curSize++
				if (curSize == size && cx.char(pos + 1) != 96) {
					return cx.append(elt(Type.InlineCode, start, pos + 1, [
						elt(Type.CodeMark, start, start + size),
						elt(Type.CodeMark, pos + 1 - size, pos + 1)
					]))
				}
			} else
				curSize = 0
		}
		return -1
	}
}

/// Inline parsing functions get access to this context, and use it to
/// read the content and emit syntax nodes.
export class InlineContext {
/// @internal
	parts: (Element | InlineDelimiter | null)[] = []

	/// @internal
	constructor(
		/// The parser that is being used.
		readonly parser: MarkdownParser,
		/// The text of this inline section.
		readonly text: string,
		/// The starting offset of the section in the document.
		readonly offset: number
	) {}

	/// Get the character code at the given (document-relative)
	/// position.
	char(pos: number) { return pos >= this.end ? -1 : this.text.charCodeAt(pos - this.offset) }

	/// The position of the end of this inline section.
	get end() { return this.offset + this.text.length }

	/// Get a substring of this inline section. Again uses
	/// document-relative positions.
	slice(from: number, to: number) { return this.text.slice(from - this.offset, to - this.offset) }

	/// @internal
	append(elt: Element | InlineDelimiter) {
		this.parts.push(elt)
		return elt.to
	}

	/// Add a [delimiter](#DelimiterType) at this given position. `open`
	/// and `close` indicate whether this delimiter is opening, closing,
	/// or both. Returns the end of the delimiter, for convenient
	/// returning from [parse functions](#InlineParser.parse).
	addDelimiter(type: DelimiterType, from: number, to: number, open: boolean, close: boolean) {
		return this.append(new InlineDelimiter(type, from, to, (open ? Mark.Open : Mark.None) | (close ? Mark.Close : Mark.None)))
	}

	/// Add an inline element. Returns the end of the element.
	addElement(elt: Element) {
		return this.append(elt)
	}

	/// Resolve markers between this.parts.length and from, wrapping matched markers in the
	/// appropriate node and updating the content of this.parts. @internal
	resolveMarkers(from: number) {
		// Scan forward, looking for closing tokens
		for (let i = from; i < this.parts.length; i++) {
			const close = this.parts[i]

			if (!(close instanceof InlineDelimiter && close.type.resolve && (close.side & Mark.Close)))
				continue

			const emp = close.type == EmphasisUnderscore || close.type == EmphasisAsterisk
			const st = close.type == Strikethrough
			const closeSize = close.to - close.from
			let open: InlineDelimiter | undefined
			let j = i - 1

			// Continue scanning for a matching opening token
			for (; j >= from; j--) {
				const part = this.parts[j]

				if (
					part instanceof InlineDelimiter
					&& (part.side & Mark.Open)
					&& part.type == close.type
					// Ignore emphasis delimiters where the character count doesn't match
					&& !(
						emp
						&& ((close.side & Mark.Open) || (part.side & Mark.Close))
						&& (part.to - part.from + closeSize) % 3 == 0
						&& ((part.to - part.from) % 3 || closeSize % 3)
					)
					&& !(
						st
						&& (part.to - part.from < 2 || closeSize < 2)
					)
				) {
					open = part
					break
				}
			}

			if (!open)
				continue

			const content = []
			let start = open.from
			let end = close.to
			let type = close.type.resolve

			// Emphasis marker effect depends on the character count. Size consumed is minimum of the two
			// markers.
			if (emp) {
				const size = Math.min(2, open.to - open.from, closeSize)
				start = open.to - size
				end = close.from + size
				type = size == 1
					? 'Emphasis'
					: close.type == EmphasisAsterisk
						? 'StrongEmphasis'
						: 'Underline'
			} else if (st) {
				start = open.to - 2
				end = close.from + 2
			}

			// Move the covered region into content, optionally adding marker nodes
			if (open.type.mark)
				content.push(this.elt(open.type.mark, start, open.to))

			for (let k = j + 1; k < i; k++) {
				if (this.parts[k] instanceof Element)
					content.push(this.parts[k] as Element)

				this.parts[k] = null
			}

			if (close.type.mark)
				content.push(this.elt(close.type.mark, close.from, end))

			const element = this.elt(type, start, end, content)

			// If there are leftover emphasis marker characters, shrink the close/open markers. Otherwise, clear them.
			this.parts[j] = (emp || st) && open.from != start
				? new InlineDelimiter(open.type, open.from, start, open.side)
				: null

			const keep = this.parts[i] = (emp || st) && close.to != end
				? new InlineDelimiter(close.type, end, close.to, close.side)
				: null

			// Insert the new element in this.parts
			if (keep)
				this.parts.splice(i, 0, element)
			else
				this.parts[i] = element
		}

		// Collect the elements remaining in this.parts into an array.
		const result = []

		for (let i = from; i < this.parts.length; i++) {
			const part = this.parts[i]

			if (part instanceof Element)
				result.push(part)
		}

		return result
	}

	/// Find an opening delimiter of the given type. Returns `null` if
	/// no delimiter is found, or an index that can be passed to
	/// [`takeContent`](#InlineContext.takeContent) otherwise.
	findOpeningDelimiter(type: DelimiterType) {
		for (let i = this.parts.length - 1; i >= 0; i--) {
			const part = this.parts[i]
			if (part instanceof InlineDelimiter && part.type == type)
				return i
		}
		return null
	}

	/// Remove all inline elements and delimiters starting from the
	/// given index (which you should get from
	/// [`findOpeningDelimiter`](#InlineContext.findOpeningDelimiter),
	/// resolve delimiters inside of them, and return them as an array
	/// of elements.
	takeContent(startIndex: number) {
		const content = this.resolveMarkers(startIndex)
		this.parts.length = startIndex
		return content
	}

	/// Skip space after the given (document) position, returning either
	/// the position of the next non-space character or the end of the
	/// section.
	skipSpace(from: number) { return skipSpace(this.text, from - this.offset) + this.offset }

	/// Create an [`Element`](#Element) for a syntax node.
	elt(type: string, from: number, to: number, children?: readonly Element[]): Element
	elt(tree: Tree, at: number): Element
	elt(type: string | Tree, from: number, to?: number, children?: readonly Element[]): Element {
		if (typeof type == 'string')
			return elt(this.parser.getNodeType(type), from, to!, children)
		return new TreeElement(type, from)
	}
}

function injectMarks(elements: readonly (Element | TreeElement)[], marks: Element[]) {
	if (!marks.length)
		return elements
	if (!elements.length)
		return marks
	const elts = elements.slice()
	let eI = 0
	for (const mark of marks) {
		while (eI < elts.length && elts[eI].to < mark.to) eI++
		if (eI < elts.length && elts[eI].from < mark.from) {
			const e = elts[eI]
			if (e instanceof Element)
				elts[eI] = new Element(e.type, e.from, e.to, injectMarks(e.children, [mark]))
		} else
			elts.splice(eI++, 0, mark)
	}
	return elts
}

// These are blocks that can span blank lines, and should thus only be
// reused if their next sibling is also being reused.
const NotLast = [Type.ListItem, Type.OrderedList, Type.BulletList]

class FragmentCursor {
// Index into fragment array
	i = 0
	// Active fragment
	fragment: TreeFragment | null = null
	fragmentEnd = -1
	// Cursor into the current fragment, if any. When `moveTo` returns
	// true, this points at the first block after `pos`.
	cursor: TreeCursor | null = null

	constructor(readonly fragments: readonly TreeFragment[], readonly input: Input) {
		if (fragments.length)
			this.fragment = fragments[this.i++]
	}

	nextFragment() {
		this.fragment = this.i < this.fragments.length ? this.fragments[this.i++] : null
		this.cursor = null
		this.fragmentEnd = -1
	}

	moveTo(pos: number, lineStart: number) {
		while (this.fragment && this.fragment.to <= pos) this.nextFragment()
		if (!this.fragment || this.fragment.from > (pos ? pos - 1 : 0))
			return false
		if (this.fragmentEnd < 0) {
			let end = this.fragment.to
			while (end > 0 && this.input.read(end - 1, end) != '\n') end--
			this.fragmentEnd = end ? end - 1 : 0
		}

		let c = this.cursor
		if (!c) {
			c = this.cursor = this.fragment.tree.cursor()
			c.firstChild()
		}

		const rPos = pos + this.fragment.offset
		while (c.to <= rPos) {
			if (!c.parent())
				return false
		}
		for (;;) {
			if (c.from >= rPos)
				return this.fragment.from <= lineStart
			if (!c.childAfter(rPos))
				return false
		}
	}

	matches(hash: number) {
		const tree = this.cursor!.tree
		return tree && tree.prop(NodeProp.contextHash) == hash
	}

	takeNodes(cx: BlockContext) {
		const cur = this.cursor!
		const off = this.fragment!.offset
		const fragEnd = this.fragmentEnd - (this.fragment!.openEnd ? 1 : 0)
		const start = cx.absoluteLineStart
		let end = start
		let blockI = cx.block.children.length
		let prevEnd = end
		let prevI = blockI
		for (;;) {
			if (cur.to - off > fragEnd) {
				if (cur.type.isAnonymous && cur.firstChild())
					continue
				break
			}
			const pos = toRelative(cur.from - off, cx.ranges)
			if (cur.to - off <= cx.ranges[cx.rangeI].to) { // Fits in current range
				cx.addNode(cur.tree!, pos)
			} else {
				const dummy = new Tree(cx.parser.nodeSet.types[Type.Paragraph], [], [], 0, cx.block.hashProp)
				cx.reusePlaceholders.set(dummy, cur.tree!)
				cx.addNode(dummy, pos)
			}
			// Taken content must always end in a block, because incremental
			// parsing happens on block boundaries. Never stop directly
			// after an indented code block, since those can continue after
			// any number of blank lines.
			if (cur.type.is('Block')) {
				if (!NotLast.includes(cur.type.id)) {
					end = cur.to - off
					blockI = cx.block.children.length
				} else {
					end = prevEnd
					blockI = prevI
					prevEnd = cur.to - off
					prevI = cx.block.children.length
				}
			}
			if (!cur.nextSibling())
				break
		}
		while (cx.block.children.length > blockI) {
			cx.block.children.pop()
			cx.block.positions.pop()
		}
		return end - start
	}
}

// Convert an input-stream-relative position to a
// Markdown-doc-relative position by subtracting the size of all input
// gaps before `abs`.
function toRelative(abs: number, ranges: readonly { from: number, to: number }[]) {
	let pos = abs
	for (let i = 1; i < ranges.length; i++) {
		const gapFrom = ranges[i - 1].to
		const gapTo = ranges[i].from
		if (gapFrom < abs)
			pos -= gapTo - gapFrom
	}
	return pos
}

const markdownHighlighting = styleTags({
	'Blockquote/...': t.quote,
	'ATXHeading1/...': t.heading1,
	'ATXHeading2/...': t.heading2,
	'ATXHeading3/...': t.heading3,
	'ATXHeading4/...': t.heading4,
	'ATXHeading5/...': t.heading5,
	'ATXHeading6/...': t.heading6,
	'Emphasis/...': t.emphasis,
	'StrongEmphasis/...': t.strong,
	'Underline/...': underlineTag,
	'Strikethrough/...': t.strikethrough,
	'OrderedList/... BulletList/...': t.list,
	'InlineCode/...': t.monospace,
	'EscapeMark HeaderMark QuoteMark EmphasisMark StrikethroughMark CodeMark LinkMark': markTag,
	'CodeInfo': t.atom,
	'Paragraph': t.content
})

/// The default CommonMark parser.
export const parser = new MarkdownParser(
	new NodeSet(nodeTypes).extend(markdownHighlighting),
	Object.keys(DefaultBlockParsers).map(n => DefaultBlockParsers[n]),
	Object.keys(DefaultBlockParsers).map(n => DefaultLeafBlocks[n]),
	Object.keys(DefaultBlockParsers),
	DefaultEndLeaf,
	DefaultSkipMarkup,
	Object.keys(DefaultInline).map(n => DefaultInline[n]),
	Object.keys(DefaultInline),
	[]
)
