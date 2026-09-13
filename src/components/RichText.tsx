// Renders lightweight markup used by the page CMS:
//   *teal*    -> <span class="text-brand-teal"> (optionally italic)
//   **bold**  -> <b class="text-black font-bold">
//   \n        -> <br/>
// Anything else renders as plain text. Order matters: parse ** before *.
import { Fragment } from "react";

interface Props {
  text: string;
  // When true, teal accent spans render italic (Home hero style).
  italicAccent?: boolean;
}

// Split a single line into styled segments.
function renderLine(line: string, italicAccent?: boolean) {
  // Tokenise on **bold** first, then *teal* inside the remaining plain chunks.
  const nodes: any[] = [];
  const boldParts = line.split(/(\*\*[^*]+\*\*)/g);

  boldParts.forEach((part, bi) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      nodes.push(
        <b key={`b-${bi}`} className="text-black font-bold">
          {part.slice(2, -2)}
        </b>
      );
      return;
    }
    // Within a non-bold chunk, handle *teal* accents.
    const tealParts = part.split(/(\*[^*]+\*)/g);
    tealParts.forEach((tp, ti) => {
      if (tp.startsWith("*") && tp.endsWith("*") && tp.length > 2) {
        nodes.push(
          <span
            key={`t-${bi}-${ti}`}
            className={italicAccent ? "italic text-brand-teal" : "text-brand-teal"}
          >
            {tp.slice(1, -1)}
          </span>
        );
      } else if (tp) {
        nodes.push(<Fragment key={`x-${bi}-${ti}`}>{tp}</Fragment>);
      }
    });
  });

  return nodes;
}

export default function RichText({ text, italicAccent }: Props) {
  const lines = (text || "").split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {renderLine(line, italicAccent)}
        </Fragment>
      ))}
    </>
  );
}
