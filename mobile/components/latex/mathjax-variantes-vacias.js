// Las variantes de la fuente TeX de MathJax que el contenido no usa
// (\mathfrak, \mathcal, \mathsf, \mathtt, \mathscr, \mathbb, oldstyle), sin
// glifos. metro.config.js redirige acá los `require` que hace
// mathjax-full/js/output/svg/fonts/tex.js: son ~190 KB de trazos que la app
// no dibuja nunca. Una fórmula que sí las pidiera saldría sin esos glifos,
// no rota.
exports.doubleStruck = {}
exports.fraktur = {}
exports.frakturBold = {}
exports.monospace = {}
exports.sansSerif = {}
exports.sansSerifBold = {}
exports.sansSerifItalic = {}
exports.sansSerifBoldItalic = {}
exports.script = {}
exports.scriptBold = {}
exports.texCalligraphic = {}
exports.texCalligraphicBold = {}
exports.texOldstyle = {}
exports.texOldstyleBold = {}
