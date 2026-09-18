import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { injectStyles } from '../src/client/style.js';

test('emits the approved scoped CSS byte sequence', () => {
  const originalDocument = globalThis.document;
  const nodes = new Map();
  globalThis.document = {
    getElementById: (id) => nodes.get(id) || null,
    createElement: () => ({ id: '', textContent: '', setAttribute() {} }),
    head: { appendChild: (node) => nodes.set(node.id, node) },
    documentElement: null,
  };

  try {
    injectStyles();
    const [style] = nodes.values();
    assert.equal(Buffer.byteLength(style.textContent), 134951);
    assert.equal(createHash('sha256').update(style.textContent).digest('hex'), '405695512d230aad2415353fc24540c14f11961be6ead14d51078310c73e563f');
    injectStyles();
    assert.equal(nodes.size, 1);
  } finally {
    globalThis.document = originalDocument;
  }
});

test('restores interaction and on-screen placement for the composer-slot popups', () => {
  const originalDocument = globalThis.document;
  const nodes = new Map();
  globalThis.document = {
    getElementById: (id) => nodes.get(id) || null,
    createElement: () => ({ id: '', textContent: '', setAttribute() {} }),
    head: { appendChild: (node) => nodes.set(node.id, node) },
    documentElement: null,
  };

  try {
    injectStyles();
    const [style] = nodes.values();
    const { textContent } = style;
    // The question, approval and plan-review surfaces render inside the
    // conversation.composer slot, so each must be covered by the fix.
    for (const marker of ['[data-question-key]', '[data-approval-key]', '[data-plan-review-key]']) {
      assert.ok(textContent.includes(marker), `popup fix must cover ${marker}`);
    }
    // Interaction: the dock is pointer-events:none and z-index:1, so the popups
    // need their own stacking and hit-testing to stay usable.
    assert.match(textContent, /\[data-question-key\][^{]*\{[^}]*pointer-events:auto!important/);
    assert.match(textContent, /\[data-question-key\][^{]*\{[^}]*z-index:60!important/);
    assert.match(textContent, /\[data-question-key\][^{]*\{[^}]*position:fixed!important/);
    // Placement: keep the card inside the viewport instead of letting the dock's
    // off-screen bottom edge push it out.
    assert.match(textContent, /\[data-question-key\][^{]*\{[^}]*max-height:min\(70vh,calc\(100dvh - 180px\)\)!important/);
  } finally {
    globalThis.document = originalDocument;
  }
});
