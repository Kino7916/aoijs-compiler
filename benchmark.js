const Lib = require("./lib/index");
const benchmark = require("benchmark");
const code = `
$if[make]
$ping
$end
`;

const suite = new benchmark.Suite();
const runtime = new Lib.Compiler.Runtime({ allowEscape: false });

suite.add("Runtime#set", () => {
    runtime.set("code", code);
})
.add("Runtime#run", () => {
    runtime.run("code");
})
.on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ 'async': false });
