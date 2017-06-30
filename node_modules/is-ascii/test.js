/* (c) 2016 Ari Porad (@ariporad) <http://ariporad.com>. License: ariporad.mit-license.org */
import test from 'ava';
import isAscii from './index';

test('ascii strings', t => {
  t.is(isAscii('foo'), true);
});

test('non-ascii strings', t => {
  t.is(isAscii('‽‽‽'), false);
});
