"use client";

import { useEffect, useRef } from "react";
import type { AppLocale } from "@/lib/ui-preferences";
import { translateUiText } from "@/lib/ui-translation-catalog";

const translatedAttributes = ["aria-label", "alt", "placeholder", "title"] as const;

type TranslationState = {
  source: string;
  applied: string;
};

export function LocalizedDocument({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: AppLocale;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const textStates = useRef(new WeakMap<Text, TranslationState>());
  const attributeStates = useRef(new WeakMap<Element, Map<string, TranslationState>>());

  useEffect(() => {
    if (!rootRef.current) return;
    const root = document.body;

    const translateTextNode = (node: Text) => {
      const current = node.nodeValue ?? "";
      const previous = textStates.current.get(node);
      const source = previous && previous.applied === current ? previous.source : current;
      const translated = translateUiText(source, locale);
      textStates.current.set(node, { source, applied: translated });
      if (translated !== current) node.nodeValue = translated;
    };

    const translateAttributes = (element: Element) => {
      let states = attributeStates.current.get(element);
      if (!states) {
        states = new Map();
        attributeStates.current.set(element, states);
      }

      for (const attribute of translatedAttributes) {
        const current = element.getAttribute(attribute);
        if (current === null) continue;
        const previous = states.get(attribute);
        const source = previous && previous.applied === current ? previous.source : current;
        const translated = translateUiText(source, locale);
        states.set(attribute, { source, applied: translated });
        if (translated !== current) element.setAttribute(attribute, translated);
      }
    };

    const translateTree = (target: Node) => {
      if (target.nodeType === Node.TEXT_NODE) {
        translateTextNode(target as Text);
        return;
      }
      if (!(target instanceof Element)) return;

      translateAttributes(target);
      const walker = document.createTreeWalker(
        target,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      );
      let node = walker.nextNode();
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) translateTextNode(node as Text);
        else translateAttributes(node as Element);
        node = walker.nextNode();
      }
    };

    translateTree(root);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") translateTree(mutation.target);
        for (const node of mutation.addedNodes) translateTree(node);
        if (mutation.type === "attributes") translateTree(mutation.target);
      }
    });
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...translatedAttributes],
    });

    return () => observer.disconnect();
  }, [locale]);

  return <div ref={rootRef} className="contents">{children}</div>;
}
