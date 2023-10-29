type JSXTextElement = string | number;

interface JSXElement {
  type: string;
  props: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  children: JSXNode[];
}

type JSXNode = JSXTextElement | JSXElement;

// This function transpiles JSX to a string

export function jsx(type: string, props: Record<string, any> | null, ...children: JSXNode[]): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  
  return renderToText({type, props: props || {}, children, });

}

function renderToText(element: JSXNode): string { 

  if (typeof element === "string" || typeof element === "number") {
    
    return element.toString();

  }

  const { type, props, children } = element;

  let text = `<${type}`;

  for (const [key, value] of Object.entries(props)) {

    text += ` ${key}="${value}"`;

  }

  text += ">";

  // Use recursion to render children

  for (const child of children) {

    text += renderToText(child);

  }

  text += `</${type}>`;

  return text;

}