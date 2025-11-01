import * as React from "react";

/**
 * Very small Markdown renderer that supports:
 * - [label](url) links
 * - plain http(s) links
 * - line breaks (\n)
 * No external libraries.
 */
export function RichText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const mdLink = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g;
  const lines = text.split("\n");

  return (
    <div className={className}>
      {lines.map((line, i) => {
        const segments: React.ReactNode[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        // 1) render markdown [label](url)
        while ((match = mdLink.exec(line)) !== null) {
          const [full, label, url] = match;
          const start = match.index;
          if (start > lastIndex) segments.push(line.slice(lastIndex, start));
          segments.push(
            <a
              key={`${i}-md-${start}`}
              href={url}
              target={url.startsWith("http") ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="underline text-orange-600 hover:text-orange-700"
            >
              {label}
            </a>
          );
          lastIndex = start + full.length;
        }

        let rest = line.slice(lastIndex);

        // 2) auto-link plain urls in the rest
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        if (urlRegex.test(rest)) {
          const parts = rest.split(urlRegex);
          rest = "";
          parts.forEach((p, idx) => {
            if (urlRegex.test(p)) {
              segments.push(
                <a
                  key={`${i}-url-${idx}`}
                  href={p}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-orange-600 hover:text-orange-700"
                >
                  {p}
                </a>
              );
            } else {
              segments.push(p);
            }
          });
        } else {
          segments.push(rest);
        }

        return (
          <p key={i} className="whitespace-pre-wrap leading-relaxed">
            {segments}
          </p>
        );
      })}
    </div>
  );
}
