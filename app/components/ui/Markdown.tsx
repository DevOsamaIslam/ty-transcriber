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
        <Typography
          key={i}
          component="code"
          sx={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: "0.9em",
            bgcolor: "rgba(32, 37, 50, 0.06)",
            borderRadius: "4px",
            px: 0.75,
            py: "2px",
            wordBreak: "break-word",
          }}
        >
          {code[1]}
        </Typography>
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
          sx={{ color: "warning.main", fontWeight: 500, textDecoration: "underline", wordBreak: "break-all" }}
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
          sx={{ mt: i === 0 ? 0 : 3, mb: 1.5 }}
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
        <List key={i} dense sx={{ mb: 2, py: 0 }}>
          {listLines.map((line, j) => {
            const marker = (line.match(LIST_ITEM) ?? [])[1] ?? "•";
            const bullet = /^\d+\./.test(marker) ? marker : "•";
            return (
              <ListItem
                key={j}
                disablePadding
                sx={{ mb: 0.5, display: "flex", alignItems: "baseline", gap: 1 }}
              >
                <Box
                  component="span"
                  sx={{
                    color: "warning.main",
                    fontWeight: 700,
                    flexShrink: 0,
                    minWidth: "1.4em",
                  }}
                >
                  {bullet}
                </Box>
                <Typography variant="body1" dir="auto" sx={{ mx: 0, minWidth: 0 }}>
                  {parseInline(line.replace(LIST_ITEM, "$2"))}
                </Typography>
              </ListItem>
            );
          })}
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
            pl: 2,
            pr: 1.5,
            py: 1,
            borderLeft: "3px solid",
            borderColor: "primary.main",
            bgcolor: "rgba(255, 184, 28, 0.08)",
            borderRadius: "0 8px 8px 0",
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