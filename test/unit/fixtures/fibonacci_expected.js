var __name__ = "__main__";

function memoize(f) {
    var memo;
    memo = {};
    return (function() {
        var ρσ_anonfunc = function (x) {
            if (!ρσ_in(x, memo)) {
                memo[(typeof x === "number" && x < 0) ? memo.length + x : x] = f(x);
            }
            return memo[(typeof x === "number" && x < 0) ? memo.length + x : x];
        };
        if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
            __argnames__ : {value: ["x"]},
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
};
if (!memoize.__argnames__) Object.defineProperties(memoize, {
    __argnames__ : {value: ["f"]},
    __module__ : {value: "__main__"}
});


var fib = memoize((function() {
    var ρσ_anonfunc = function fib(n) {
        if ((n === 0 || typeof n === "object" && ρσ_equals(n, 0))) {
            return 0;
        } else if ((n === 1 || typeof n === "object" && ρσ_equals(n, 1))) {
            return 1;
        } else {
            return fib(n - 1) + fib(n - 2);
        }
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["n"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());

assrt.equal(fib(0), 0);
assrt.equal(fib(1), 1);
assrt.equal(fib(10), 55);
assrt.equal(fib(15), 610);