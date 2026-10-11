import test from 'node:test';
import assert from 'node:assert/strict';
import { cartReducer, initialCartState } from '../src/lib/cart-reducer.ts';
import type { CartItem } from '../src/lib/cart-reducer.ts';

test('cartReducer adds an item to cart', () => {
  const item: Omit<CartItem, 'id'> = {
    bundleCode: '101',
    name: 'Kopi Kenangan Mantan',
    basePrice: 20000,
    variantAddition: 0,
    toppingTotal: 0,
    quantity: 1,
  };

  const state1 = cartReducer(initialCartState, {
    type: 'ADD_ITEM',
    payload: { item, outletCode: 'OUT-1', outletName: 'Outlet Satu' },
  });

  assert.equal(state1.items.length, 1);
  assert.equal(state1.items[0].quantity, 1);
  assert.equal(state1.outletCode, 'OUT-1');
});

test('cartReducer merges quantity when adding identical item (same configuration)', () => {
  const item: Omit<CartItem, 'id'> = {
    bundleCode: '101',
    name: 'Kopi Kenangan Mantan',
    basePrice: 20000,
    variantAddition: 0,
    toppingTotal: 0,
    quantity: 1,
    variantDescription: 'Ice, Regular',
    notes: 'Less Sugar',
  };

  const state1 = cartReducer(initialCartState, {
    type: 'ADD_ITEM',
    payload: { item, outletCode: 'OUT-1', outletName: 'Outlet Satu' },
  });

  const state2 = cartReducer(state1, {
    type: 'ADD_ITEM',
    payload: { item: { ...item, quantity: 2 }, outletCode: 'OUT-1', outletName: 'Outlet Satu' },
  });

  assert.equal(state2.items.length, 1);
  assert.equal(state2.items[0].quantity, 3);
});

test('cartReducer keeps items separate if variants or notes differ', () => {
  const item1: Omit<CartItem, 'id'> = {
    bundleCode: '101',
    name: 'Kopi Kenangan Mantan',
    basePrice: 20000,
    variantAddition: 0,
    toppingTotal: 0,
    quantity: 1,
    notes: 'No Sugar',
  };

  const item2: Omit<CartItem, 'id'> = {
    bundleCode: '101',
    name: 'Kopi Kenangan Mantan',
    basePrice: 20000,
    variantAddition: 0,
    toppingTotal: 0,
    quantity: 1,
    notes: 'Normal Sugar',
  };

  const state1 = cartReducer(initialCartState, {
    type: 'ADD_ITEM',
    payload: { item: item1, outletCode: 'OUT-1', outletName: 'Outlet Satu' },
  });

  const state2 = cartReducer(state1, {
    type: 'ADD_ITEM',
    payload: { item: item2, outletCode: 'OUT-1', outletName: 'Outlet Satu' },
  });

  assert.equal(state2.items.length, 2);
});

test('cartReducer updates quantity and removes when quantity is 0', () => {
  const item: Omit<CartItem, 'id'> = {
    bundleCode: '101',
    name: 'Americano',
    basePrice: 15000,
    variantAddition: 0,
    toppingTotal: 0,
    quantity: 2,
  };

  const state1 = cartReducer(initialCartState, {
    type: 'ADD_ITEM',
    payload: { item, outletCode: 'OUT-1', outletName: 'Outlet Satu' },
  });

  const id = state1.items[0].id;
  const state2 = cartReducer(state1, {
    type: 'UPDATE_QUANTITY',
    payload: { id, quantity: 5 },
  });
  assert.equal(state2.items[0].quantity, 5);

  const state3 = cartReducer(state2, {
    type: 'UPDATE_QUANTITY',
    payload: { id, quantity: 0 },
  });
  assert.equal(state3.items.length, 0);
});

test('cartReducer removes item and clears cart', () => {
  const item: Omit<CartItem, 'id'> = {
    bundleCode: '101',
    name: 'Americano',
    basePrice: 15000,
    variantAddition: 0,
    toppingTotal: 0,
    quantity: 1,
  };

  const state1 = cartReducer(initialCartState, {
    type: 'ADD_ITEM',
    payload: { item, outletCode: 'OUT-1', outletName: 'Outlet Satu' },
  });

  const state2 = cartReducer(state1, { type: 'CLEAR_CART' });
  assert.equal(state2.items.length, 0);
});
