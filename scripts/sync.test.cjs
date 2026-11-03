'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { getComponentSignature } = require('./cli-sync.cjs');
const { parseVariantsAndProps } = require('./code-generator.cjs');

test('Figma component-set options become the generated variant and size options', () => {
  const componentSet = {
    type: 'COMPONENT_SET',
    name: 'Button',
    componentPropertyDefinitions: {
      Type: { type: 'VARIANT', variantOptions: ['Primary', 'Destructive'] },
      Size: { type: 'VARIANT', variantOptions: ['Small', 'Extra Large'] }
    },
    children: []
  };

  const meta = parseVariantsAndProps(componentSet);

  assert.deepEqual(meta.variants, ['primary', 'destructive']);
  assert.deepEqual(meta.sizes, ['small', 'extra-large']);
});

test('a Figma variant addition or removal changes the component signature', () => {
  const before = {
    type: 'COMPONENT_SET',
    name: 'Button',
    children: [{ id: '1:1', name: 'Type=Primary, Size=Small' }]
  };
  const afterAddition = {
    ...before,
    children: [...before.children, { id: '1:2', name: 'Type=Danger, Size=Small' }]
  };
  const afterRemoval = {
    ...before,
    children: []
  };

  assert.notEqual(getComponentSignature(before), getComponentSignature(afterAddition));
  assert.notEqual(getComponentSignature(before), getComponentSignature(afterRemoval));
});
