import fg from "fast-glob";
import { fromMarkdown } from "mdast-util-from-markdown";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { mdxjs } from "micromark-extension-mdxjs";
import docgen from "react-docgen-typescript";
import { visit } from "unist-util-visit";

export function transformPropsTable(tree) {
  let needsImport = true;

  visit(
    tree,
    { name: "ax-props-table", type: "mdxJsxFlowElement" },
    (node, index, parent) => {
      const docs = docgen
        .withCompilerOptions(
          { esModuleInterop: true },
          {
            savePropValueAsString: true,
            shouldExtractValuesFromUnion: true,
          },
        )
        .parse(
          fg.globSync("../../packages/react/src/**/*.{css.ts,tsx}", {
            ignore: ["**/*.spec.*"],
          }),
        );

      const componentRaw = node.attributes.find(
        (attr) => attr.name === "component",
      ).value;
      const component = componentRaw.value ?? componentRaw;
      const excludeRaw = node.attributes.find(
        (attr) => attr.name === "exclude",
      )?.value;
      const exclude = excludeRaw
        ? JSON.parse(excludeRaw.value)
        : ["key", "ref"];
      const doc = docs.find(
        (doc) => doc.displayName === `@optiaxiom/react/${component}`,
      );
      if (!doc) {
        throw new Error(`Could not find component doc: ${component}`);
      }
      const sprinkles = docs.find(
        (sprinkle) =>
          sprinkle.displayName === "sprinkles" &&
          sprinkle.filePath === doc.filePath.replace(".tsx", ".css.ts"),
      );

      const tree = fromMarkdown(
        [
          needsImport &&
            `import { Table, Td, Th, Tr } from "@/components/table";`,
          "",
          `### \`${component}\` component props`,
          "",
          "<Table>",
          "  <thead>",
          "    <tr>",
          '      <Th asChild style={{ width: "25%" }}>',
          "        Name",
          "      </Th>",
          '      <Th asChild style={{ width: "75%" }}>',
          "        Type",
          "      </Th>",
          "    </tr>",
          "  </thead>",
          "  <tbody>",
          ...Object.entries(doc.props)
            .sort(([a], [b]) => a.localeCompare(b))
            .filter(
              ([, prop]) =>
                !exclude.includes(prop.name) &&
                prop.type.name !== "any" &&
                ((prop.declarations.length === 0 &&
                  Object.hasOwn(sprinkles?.props ?? {}, prop.name)) ||
                  prop.declarations.find(
                    (decl) => decl.fileName === doc.filePath,
                  )),
            )
            .flatMap(([, prop]) => [
              "<Tr>",
              '  <Td className="nx-whitespace-nowrap">',
              `**${prop.name}**`,
              "  </Td>",
              "  <Td>",
              [
                [
                  parseType(prop.type, prop.name, component),
                  ...(prop.defaultValue
                    ? ["=", `\`${prop.defaultValue.value}\``]
                    : []),
                ].join(" "),
                prop.description,
              ]
                .filter(Boolean)
                .join("\n\n"),
              "  </Td>",
              "</Tr>",
            ]),
          "  </tbody>",
          "</Table>",
        ].join("\n"),
        {
          extensions: [mdxjs()],
          mdastExtensions: [mdxFromMarkdown()],
        },
      );
      visit(tree, { type: "mdxJsxFlowElement" }, (node) => {
        node.data = { _mdxExplicitJsx: true };
      });
      parent.children.splice(index, 1, ...tree.children);

      needsImport = false;

      return index + tree.children.length;
    },
  );
}

function parseType(type, prop, component) {
  if (type.name === "enum") {
    switch (prop) {
      case "background":
      case "color":
        return themeLink("color");
      case "borderRadius":
        return themeLink("radius");
      case "fontSize":
        switch (component) {
          case "Heading":
            return themeLink("headings.fontSize");
          default:
            return themeLink("fontSize");
        }
      case "lineHeight":
        switch (component) {
          case "Heading":
            return themeLink("headings.lineHeight");
          default:
            return themeLink("lineHeight");
        }
      case "gap":
      case "margin":
      case "marginBottom":
      case "marginLeft":
      case "marginRight":
      case "marginTop":
      case "marginX":
      case "marginY":
      case "padding":
      case "paddingBottom":
      case "paddingLeft":
      case "paddingRight":
      case "paddingTop":
      case "paddingX":
      case "paddingY":
        return themeLink("space");
      case "shadow":
        return themeLink("shadow");
      case "size":
        switch (component) {
          case "Box":
            return themeLink("size");
        }
        break;
    }
  }
  return type.name === "enum"
    ? `\`${(type.raw?.startsWith("ConditionalStyleWithResponsiveArray<")
        ? type.value.slice(0, -2)
        : type.raw?.startsWith("ConditionalStyle<")
          ? type.value.slice(0, -1)
          : type.value
      )
        .map(({ value }) => value)
        .join(" | ")}\``
    : `\`${type.raw ?? type.name}\``;
}

function themeLink(key) {
  const linkMap = {
    color: "/colors/",
    radius: "/border-radius/",
    size: "/sizing/",
    space: "/spacing/",
  };
  return `[\`theme.${key}\`](/docs${linkMap[key] ?? "/theme/#design-tokens"})`;
}
