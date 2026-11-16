import { Fragment, type ReactNode } from "react";

/** Renders text where `backticks` mark inline code. */
export function Inline({ text }: { text: string }): ReactNode {
  return text.split("`").map((part, index) =>
    index % 2 === 1 ? (
      <code key={index} className="inline-code">
        {part}
      </code>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}
