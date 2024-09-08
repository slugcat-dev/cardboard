// https://github.com/lezer-parser/markdown

import { parseMixed } from '@lezer/common'
import type { Input, Parser, SyntaxNodeRef } from '@lezer/common'
import { type MarkdownExtension, Type } from './markdown'

export {
	parser,
	MarkdownParser,
	Line,
	Element,
	LeafBlock,
	BlockContext,
	InlineContext,
	type DelimiterType,
	type MarkdownConfig,
	type MarkdownExtension,
	type NodeSpec,
	type InlineParser,
	type BlockParser,
	type LeafBlockParser
} from './markdown'

// Create a Markdown extension to enable nested parsing on code blocks
export function parseCode(config: {
	// When provided, this will be used to parse the content of code blocks.
	// `info` is the string after the opening ` ``` ` marker, or an empty string if there is no such info.
	codeParser?: (info: string) => null | Parser
}): MarkdownExtension {
	const { codeParser } = config
	const wrap = parseMixed((node: SyntaxNodeRef, input: Input) => {
		const id = node.type.id

		if (codeParser && id === Type.FencedCode) {
			const infoNode = node.node.getChild(Type.CodeInfo)
			let info = ''

			if (infoNode)
				info = input.read(infoNode.from, infoNode.to)

			const parser = codeParser(info)

			if (parser)
				return { parser, overlay: node => node.type.id === Type.CodeText }
		}

		return null
	})

	return { wrap }
}
