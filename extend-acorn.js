// This is hopefully not a concerning hack. Webpack 4 (and maybe later) doesn't
// like "field declarations" in javascript classes, which created a problem for
// the `ecpair` package. Webpack uses a parser called acorn. The makers of
// acorn created a plugin that can support field declarations. I have to invoke
// this script in a funny way (see the linked comment and/or scripts:start in
// package.json)
//
// https://github.com/webpack/webpack/issues/10216#issuecomment-782696611

const classFields = require('acorn-class-fields');
const acorn = require('acorn');
acorn.Parser = acorn.Parser.extend(classFields);
