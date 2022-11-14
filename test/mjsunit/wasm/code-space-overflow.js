// Copyright 2022 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Flags: --wasm-max-code-space-size-mb=1
// Disable lazy compilation, so we actually generate a lot of code at once.
// Flags: --no-wasm-lazy-compilation
// Limit the number of background threads, so each thread generates more code.
// Flags: --wasm-num-compilation-tasks=2

// This is a regression test for https://crbug.com/v8/13436. If a single
// background thread generates more code than fits in a single code space, we
// need to split it into multiple code spaces.

d8.file.execute('test/mjsunit/wasm/wasm-module-builder.js');

// At the time of writing this test (Nov 2022), this module generated ~20MB of
// code on x64 and ~18MB on arm64.
const builder = new WasmModuleBuilder();
const kNumFunctions = 1500;
// Build a large body. Then append one instruction to get different code per
// function (for the case that we decide to merge identical code objects in the
// future).
let body_template = [kExprLocalGet, 0];
for (let i = 0; i < kNumFunctions; ++i) {
  body_template.push(kExprCallFunction, ...wasmSignedLeb(i));
}
for (let i = 0; i < kNumFunctions; ++i) {
  let body = body_template.concat([...wasmI32Const(i), kExprI32Add]);
  builder.addFunction('f' + i, kSig_i_i).addBody(body);
}
builder.toModule();
