export type ComponentResolution =
  | { readonly mode: "base"; readonly component: string }
  | { readonly mode: "variant"; readonly component: string; readonly variant: string }
  | { readonly mode: "replacement"; readonly component: string };

export interface ComponentDefinition {
  readonly variants?: Readonly<Record<string, string>>;
  readonly replacements?: Readonly<Record<string, string>>;
}

export class ComponentResolver {
  constructor(
    private readonly definitions: Readonly<Record<string, ComponentDefinition>>,
  ) {}

  resolve(component: string, context: { variant?: string; replacement?: string } = {}): ComponentResolution {
    const definition = this.definitions[component];

    if (context.replacement && definition?.replacements?.[context.replacement]) {
      return {
        mode: "replacement",
        component: definition.replacements[context.replacement],
      };
    }

    if (context.variant && definition?.variants?.[context.variant]) {
      return {
        mode: "variant",
        component: definition.variants[context.variant],
        variant: context.variant,
      };
    }

    return { mode: "base", component };
  }
}
