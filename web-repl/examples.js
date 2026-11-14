/* vim:fileencoding=utf-8
 *
 * Example programs for the web REPL. Each `expect` is the exact stdout the program prints;
 * test/unit/web-repl.js runs every example against it, as does the in-page self-test.
 */
(function (root) {
    "use strict";

    var VIRTUAL_FILES = {
        greeting: "def hello(name):\n    return \"Hello, \" + name + \"!\"\n",
    };

    var EXAMPLES = [
        {
            id: "playground",
            label: "Playground",
            source: String.raw`# Edit me: compiles as you type, Ctrl+Enter runs.
# Hover any line (either side) to see what it maps to.
from collections import Counter


class Vector:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)

    def __repr__(self):
        return f"Vector({self.x}, {self.y})"


def fib():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b


def describe(point):
    match point:
        case (0, 0):
            return "origin"
        case (x, 0):
            return f"on the x axis at {x}"
        case (x, y):
            return f"at {x}, {y}"


squares = {n: n * n for n in range(1, 8) if n % 2}
print("odd squares:", squares)

gen = fib()
print("fibonacci:", [next(gen) for _ in range(10)])

print(Vector(1, 2) + Vector(3, 4))
print(describe((0, 0)), "/", describe((5, 0)), "/", describe((2, 3)))

words = "the quick brown fox jumps over the lazy dog then the end".split()
word, n = Counter(words).most_common(1)[0]
print(f"most common word: {word!r} ({n} times)")
`,
            expect: "odd squares: {1: 1, 3: 9, 5: 25, 7: 49}\nfibonacci: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]\nVector(4, 6)\norigin / on the x axis at 5 / at 2, 3\nmost common word: 'the' (3 times)\n",
        },
        {
            id: "classes",
            label: "Classes, dataclasses & properties",
            source: String.raw`from dataclasses import dataclass


@dataclass
class Item:
    name: str
    price: float
    qty: int = 1

    @property
    def total(self):
        return self.price * self.qty


class Shape:
    count = 0

    def __init__(self, name):
        self.name = name
        Shape.count += 1

    @classmethod
    def unit(cls):
        return cls(1)

    def area(self):
        raise TypeError(f"{self.name} must define area()")

    def __str__(self):
        return f"{self.name} with area {self.area():.2f}"


class Square(Shape):
    def __init__(self, side):
        super().__init__("square")
        self.side = side

    def area(self):
        return self.side ** 2


class Circle(Shape):
    def __init__(self, r):
        super().__init__("circle")
        self.r = r

    def area(self):
        return 3.14159 * self.r ** 2


cart = [Item("apple", 0.5, 6), Item("bread", 2.25)]
print(cart[0])
print("cart total:", sum(i.total for i in cart))

for shape in [Square(3), Circle.unit(), Square.unit()]:
    print(shape)
print("shapes made:", Shape.count)
print(isinstance(Square(1), Shape), Square.__name__, Square.unit().__class__.__name__)
`,
            expect: "Item(name='apple', price=0.5, qty=6)\ncart total: 5.25\nsquare with area 9.00\ncircle with area 3.14\nsquare with area 1.00\nshapes made: 3\nTrue Square Square\n",
        },
        {
            id: "generators",
            label: "Generators & itertools",
            source: String.raw`from itertools import islice, groupby, accumulate, permutations
from functools import reduce


def primes():
    found = []
    n = 2
    while True:
        if all(n % p for p in found):
            found.append(n)
            yield n
        n += 1


print("first primes:", list(islice(primes(), 12)))
print("running total:", list(accumulate([3, 1, 4, 1, 5, 9, 2, 6])))
print("product:", reduce(lambda a, b: a * b, range(1, 8)))
print("anagrams:", ["".join(p) for p in permutations("abc")])

data = sorted(["apple", "avocado", "banana", "blueberry", "cherry"], key=lambda w: w[0])
for letter, group in groupby(data, key=lambda w: w[0]):
    print(letter, "->", list(group))

matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
print("transpose:", [list(row) for row in zip(*matrix)])
print("flat evens:", [x for row in matrix for x in row if x % 2 == 0])
`,
            expect: "first primes: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]\nrunning total: [3, 4, 8, 9, 14, 23, 25, 31]\nproduct: 5040\nanagrams: ['abc', 'acb', 'bac', 'bca', 'cab', 'cba']\na -> ['apple', 'avocado']\nb -> ['banana', 'blueberry']\nc -> ['cherry']\ntranspose: [[1, 4, 7], [2, 5, 8], [3, 6, 9]]\nflat evens: [2, 4, 6, 8]\n",
        },
        {
            id: "errors",
            label: "Exceptions & tracebacks",
            source: String.raw`def parse_age(text):
    age = int(text)
    if age < 0:
        raise ValueError(f"age must be positive, got {age}")
    return age


for raw in ["42", "-3", "abc"]:
    try:
        print("ok:", parse_age(raw))
    except ValueError as e:
        print("caught:", e)


def lookup(table, key):
    return table[key]


ages = {"alice": 31}
print("alice is", lookup(ages, "alice"))
print("bob is", lookup(ages, "bob"))  # KeyError: the traceback points back here
`,
            expect: "ok: 42\ncaught: ValueError: age must be positive, got -3\ncaught: ValueError: Invalid literal for int with base 10: abc\nalice is 31\n",
            expect_error: "KeyError",
        },
        {
            id: "async",
            label: "async / await",
            source: String.raw`def sleep(ms):
    return Promise(def(resolve, reject): setTimeout(resolve, ms);)


async def worker(name, delay):
    for i in range(3):
        await sleep(delay)
        print(f"{name} tick {i}")
    return name.upper()


async def main():
    results = await Promise.all([worker("fast", 100), worker("slow", 250)])
    print("done:", results)


main()
`,
            expect: "fast tick 0\nfast tick 1\nslow tick 0\nfast tick 2\nslow tick 1\nslow tick 2\ndone: ['FAST', 'SLOW']\n",
        },
        {
            id: "imports",
            label: "Imports & the standard library",
            source: String.raw`# "greeting" is a virtual module supplied by this page:
#     def hello(name):
#         return "Hello, " + name + "!"
from greeting import hello
from collections import defaultdict, namedtuple
import math
import re

print(hello("RapydScript"))

Point = namedtuple("Point", ["x", "y"])
p = Point(3, 4)
print(p, "distance:", math.hypot(p.x, p.y))

by_letter = defaultdict(set)
text = "Simple is better than complex. Complex is better than complicated."
for word in re.findall(r"\w+", text.lower()):
    by_letter[word[0]].add(word)
for letter in sorted(by_letter):
    print(letter, sorted(by_letter[letter]))
`,
            expect: "Hello, RapydScript!\nPoint(x=3, y=4) distance: 5\nb ['better']\nc ['complex', 'complicated']\ni ['is']\ns ['simple']\nt ['than']\n",
        },
        {
            id: "syntax",
            label: "A compile error",
            source: String.raw`print("total:" 42)
`,
            expect_compile_error: true,
        },
    ];

    var api = { EXAMPLES: EXAMPLES, VIRTUAL_FILES: VIRTUAL_FILES };
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    else root.RapydScriptExamples = api;
})(this);
