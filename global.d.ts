declare namespace JSX {
  
  interface HTMLAttributes {
    class?: string;
    id?: string;
  }

  interface IntrinsicElements {
    [elem: string]: HTMLAttributes;
  }

}