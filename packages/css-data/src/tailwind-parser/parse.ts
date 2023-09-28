import * as csstree from "css-tree";
import camelCase from "camelcase";
import { UnoGenerator, createGenerator } from "@unocss/core";
import { type Theme, presetUno } from "@unocss/preset-uno";
import type { EmbedTemplateStyleDecl } from "@webstudio-is/react-sdk";
import { expandTailwindShorthand } from "./shorthand";
import { substituteVariables } from "./substitute";
import warnOnce from "warn-once";
import { parseCssValue } from "../parse-css-value";
import { type StyleProperty } from "@webstudio-is/css-engine";

let unoLazy: UnoGenerator<Theme> | undefined = undefined;

const uno = () => {
  unoLazy = createGenerator({
    presets: [presetUno()],
  });
  return unoLazy;
};

/**
 * Parses Tailwind classes to CSS by expanding shorthands and substituting variables.
 */
export const parseTailwindToCss = async (classes: string, warn = warnOnce) => {
  const expandedClasses = expandTailwindShorthand(classes);
  const generated = await uno().generate(expandedClasses, { preflights: true });

  const cssWithClasses = substituteVariables(generated.css, warn);
  return cssWithClasses;
};

/**
 * Convert CSS prepared by parseTailwindToCss to Webstudio format.
 */
const parseCssToWebstudio = (css: string) => {
  const ast = csstree.parse(css);
  const styles: EmbedTemplateStyleDecl[] = [];

  csstree.walk(ast, {
    enter: (node, item, list) => {
      if (node.type === "Declaration") {
        const property = camelCase(node.property.trim());
        const cssValue = csstree.generate(node.value);

        const style: EmbedTemplateStyleDecl = {
          property: property as StyleProperty,
          value: parseCssValue(property as StyleProperty, cssValue),
        };

        styles.push(style);
      }
    },
  });

  return styles;
};

/**
 * Parses Tailwind classes to webstudio template format.
 */
export const parseTailwindToWebstudio = async (
  classes: string,
  warn = warnOnce
) => {
  const css = await parseTailwindToCss(classes, warn);
  const styles = parseCssToWebstudio(css);
  return styles;
};