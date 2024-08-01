// https://github.com/lezer-parser/markdown/tree/main/src

import { parseMixed } from '@lezer/common'
import type { Input, Parser, SyntaxNodeRef } from '@lezer/common'
import { type MarkdownExtension, Type } from './markdown'

export { parser, MarkdownParser, type MarkdownConfig, type MarkdownExtension,	type NodeSpec, type InlineParser, type BlockParser, type LeafBlockParser,	Line, Element, LeafBlock, type DelimiterType, BlockContext, InlineContext } from './markdown'

/// Create a Markdown extension to enable nested parsing on code
/// blocks and/or embedded HTML.
export function parseCode(config: {
	/// When provided, this will be used to parse the content of code
	/// blocks. `info` is the string after the opening ` ``` ` marker,
	/// or the empty string if there is no such info or this is an
	/// indented code block. If there is a parser available for the
	/// code, it should return a function that can construct the
	/// [parse](https://lezer.codemirror.net/docs/ref/#common.PartialParse).
	codeParser?: (info: string) => null | Parser
}): MarkdownExtension {
	const { codeParser } = config
	const wrap = parseMixed((node: SyntaxNodeRef, input: Input) => {
		const id = node.type.id

		if (codeParser && (id === Type.CodeBlock || id === Type.FencedCode)) {
			let info = ''

			if (id === Type.FencedCode) {
				const infoNode = node.node.getChild(Type.CodeInfo)

				if (infoNode)
					info = input.read(infoNode.from, infoNode.to)
			}

			const parser = codeParser(info)

			if (parser)
				return { parser, overlay: node => node.type.id === Type.CodeText }
		}

		return null
	})

	return { wrap }
}
