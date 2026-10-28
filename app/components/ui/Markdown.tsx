import React from "react";
import { Box, Divider, Link, List, ListItem, Typography } from "@mui/material";

export type MarkdownProps = {
  children: string;
};

const HEADING_VARIANTS: Record<
  number,
  React.ComponentProps<typeof Typography>["variant"]
> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
};

const LIST_ITEM = /^([*+-]|\d+\.)\s+(.*)$/;

/**
 * Parses inline markdown (`**bold**`, `*italic*`, `` `code` ``, `[link](url)`)
 * into React nodes. Unknown syntax is left as plain text.
 */
function parseInline(text: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let buffer = "";
  const flush = () => {
    if (buffer) {
      nodes.push(buffer);
      buffer = "";
    }
  };

  while (i < text.length) {
    const rest = text.slice(i);
    const strong = rest.match(/^\*\*(.+?)\*\*/s);
    const em = rest.match(/^\*(.+?)\*/s);
    const code = rest.match(/^`(.+?)`/s);
    const link = rest.match(/^\[(.+?)\]\(([^)]*)\)/s);

    if (strong) {
      flush();
      nodes.push(<strong key={i}>{parseInline(strong[1])}</strong>);
      i += strong[0].length;
    } else if (em) {
      flush();
      nodes.push(<em key={i}>{parseInline(em[1])}</em>);
      i += em[0].length;
    } else if (code) {
      flush();
      nodes.push(
        <code key={i} sx={{ fontFamily: "monospace" }}>
          {code[1]}
        </code>
      );
      i += code[0].length;
    } else if (link) {
      flush();
      nodes.push(
        <Link
          key={i}
          component="a"
          href={link[2]}
          target="_blank"
          rel="noopener"
          sx={{ color: "primary", textDecoration: "underline", wordBreak: "break-all" }}
        >
          {parseInline(link[1])}
        </Link>
      );
      i += link[0].length;
    } else {
      buffer += text[i];
      i += 1;
    }
  }

  flush();
  return nodes;
}

function parseBlocks(text: string): React.ReactNode[] {
  const blocks = text.split(/\n\n+/);
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block.split("\n");
    const nonEmpty = lines.filter((line) => line.trim() !== "");
    const trimmed = block.trim();

    // Thematic break.
    if (/^[-*_]{3,}\s*$/.test(trimmed)) {
      nodes.push(<Divider key={i} sx={{ my: 2 }} />);
      continue;
    }

    // Heading.
    const heading = block.match(/^(#{1,6})\s+(.*)$/s);
    if (heading) {
      const level = heading[1].length;
      nodes.push(
        <Typography
          key={i}
          variant={HEADING_VARIANTS[level]}
          component={`h${level}` as React.ComponentProps<typeof Typography>["component"]}
          dir="auto"
          sx={{ mb: 2, mt: level === 1 ? 3 : 0 }}
        >
          {parseInline(heading[2].trim())}
        </Typography>
      );
      continue;
    }

    // List (every non-empty line is a list item).
    const listLines = nonEmpty.filter((line) => LIST_ITEM.test(line));
    if (listLines.length > 0 && listLines.length === nonEmpty.length) {
      nodes.push(
        <List key={i} dense sx={{ mb: 2, pl: 2 }}>
          {listLines.map((line, j) => (
            <ListItem key={j} disablePadding sx={{ mb: 0.5 }}>
              <Typography variant="body1" dir="auto" sx={{ mx: 0 }}>
                {parseInline(line.replace(LIST_ITEM, "$2"))}
              </Typography>
            </ListItem>
          ))}
        </List>
      );
      continue;
    }

    // Blockquote (every non-empty line is a quote line).
    const quoteLines = nonEmpty.filter((line) => /^>\s?/.test(line));
    if (quoteLines.length > 0 && quoteLines.length === nonEmpty.length) {
      const content = quoteLines.map((line) => line.replace(/^>\s?/, "")).join("\n");
      nodes.push(
        <Typography
          key={i}
          variant="body2"
          color="text.secondary"
          dir="auto"
          sx={{
            pl: 1.5,
            borderLeft: "2px solid",
            borderColor: "divider",
            my: 2,
            fontStyle: "italic",
          }}
        >
          {parseInline(content)}
        </Typography>
      );
      continue;
    }

    // Paragraph.
    nodes.push(
      <Typography key={i} variant="body1" dir="auto" sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
        {parseInline(block)}
      </Typography>
    );
  }

  return nodes;
}

export function Markdown({ children }: MarkdownProps) {
  return <Box>{parseBlocks(children)}</Box>;
}