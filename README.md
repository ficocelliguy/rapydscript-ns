RapydScript
===========


[![Build Status](https://github.com/ficocelliguy/rapydscript-ns/actions/workflows/ci.yml/badge.svg)](https://github.com/ficocelliguy/rapydscript-ns/actions?query=workflow%3ACI)
[![Current Release](https://img.shields.io/npm/v/rapydscript-ns)](https://www.npmjs.com/package/rapydscript-ns)
[![Known Vulnerabilities](https://snyk.io/test/github/ficocelliguy/rapydscript-ns/badge.svg)](https://snyk.io/test/github/ficocelliguy/rapydscript-ns)

RapydScript is a pre-compiler for Javascript that uses syntax (almost) identical to modern Python. It transpiles 
to native JS (with source maps) that reads like your Python code, but runs in the browser or node.
[Try RapydScript-ns live via an in-browser REPL!](https://ficocelliguy.github.io/rapydscript-ns/)

This is a [fork of the original RapydScript](#reasons-for-the-fork) that adds many new features. The most notable
change is that all the Python features that are optional in RapydScript are now enabled by default.


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Contents**

- [What is RapydScript?](#what-is-rapydscript)
- [Installation](#installation)
- [Compilation](#compilation)
- [Getting Started](#getting-started)
- [Leveraging other APIs](#leveraging-other-apis)
- [Anonymous Functions](#anonymous-functions)
- [Lambda Expressions](#lambda-expressions)
- [Decorators](#decorators)
- [Self-Executing Functions](#self-executing-functions)
- [Chaining Blocks](#chaining-blocks)
- [Function calling with optional arguments](#function-calling-with-optional-arguments)
  - [Positional-only and keyword-only parameters](#positional-only-and-keyword-only-parameters)
- [Inferred Tuple Packing/Unpacking](#inferred-tuple-packingunpacking)
- [Operators and keywords](#operators-and-keywords)
- [Literal JavaScript](#literal-javascript)
- [Containers (lists/sets/dicts)](#containers-listssetsdicts)
  - [Container comparisons](#container-comparisons)
- [Loops](#loops)
- [List/Set/Dict Comprehensions](#listsetdict-comprehensions)
- [Strings](#strings)
- [The Existential Operator](#the-existential-operator)
- [Walrus Operator](#walrus-operator)
- [Ellipsis Literal](#ellipsis-literal)
- [Extended Subscript Syntax](#extended-subscript-syntax)
- [Variable Type Annotations](#variable-type-annotations)
- [Regular Expressions](#regular-expressions)
- [JSX Support](#jsx-support)
- [Creating DOM trees easily](#creating-dom-trees-easily)
- [Classes](#classes)
  - [External Classes](#external-classes)
  - [Method Binding](#method-binding)
- [Iterators](#iterators)
- [Generators](#generators)
- [Modules](#modules)
- [Structural Pattern Matching](#structural-pattern-matching)
- [Exception Handling](#exception-handling)
- [Scope Control](#scope-control)
- [Available Libraries](#available-libraries)
- [Linter](#linter)
- [Making RapydScript even more pythonic](#making-rapydscript-even-more-pythonic)
- [Advanced Usage Topics](#advanced-usage-topics)
    - [Browser Compatibility](#browser-compatibility)
    - [Tabs vs Spaces](#tabs-vs-spaces)
    - [External Libraries and Classes](#external-libraries-and-classes)
    - [Embedding the RapydScript compiler in your webpage](#embedding-the-rapydscript-compiler-in-your-webpage)
- [Internationalization](#internationalization)
- [Gotchas](#gotchas)
- [Monaco Language Service](#monaco-language-service)
    - [Building the bundle](#building-the-bundle)
    - [Basic setup](#basic-setup)
    - [Options](#options)
    - [Runtime API](#runtime-api)
    - [TypeScript declaration files](#typescript-declaration-files)
    - [Virtual modules](#virtual-modules)
    - [Source maps](#source-maps)
    - [Running the tests](#running-the-tests)
- [Reasons for the fork](#reasons-for-the-fork)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


What is RapydScript?
--------------------

RapydScript (pronounced 'RapidScript') is a pre-compiler for JavaScript,
similar to CoffeeScript, but with cleaner, more readable syntax. The syntax is
almost identical to Python, but RapydScript has a focus on performance and
interoperability with external JavaScript libraries. This means that the
JavaScript that RapydScript generates is performant and quite close to hand-
written JavaScript.

RapydScript allows to write your front-end in Python without the overhead that
other similar frameworks introduce - the performance is the same as with pure
JavaScript. To those familiar with CoffeeScript, RapydScript is similar, but 
inspired by Python's readability rather than Ruby's cleverness. To those familiar
with Pyjamas, RapydScript brings many of the same features and support for Python
syntax without the same overhead. RapydScript combines the best features of Python
as well as JavaScript, bringing you features most other Pythonic JavaScript 
replacements overlook. Here are a few features of RapydScript:

- classes that work and feel similar to Python
- an import system for modules/packages that works just like Python's
- optional function arguments that work similar to Python
- inheritance system that's both, more powerful than Python and cleaner than JavaScript
- support for object literals with anonymous functions, like in JavaScript
- ability to invoke any JavaScript/DOM object/function/method as if it's part of the same framework, without the need for special syntax
- variable and object scoping that make sense (no need for repetitive 'var' or 'new' keywords)
- ability to use both, Python's methods/functions and JavaScript's alternatives
- similar to above, ability to use both, Python's and JavaScript's tutorials (as well as widgets)
- it's self-hosting, that means the compiler is itself written in RapydScript and compiles into JavaScript


Installation
------------

[Try RapydScript-ns live via an in-browser REPL!](https://ficocelliguy.github.io/rapydscript-ns/)

First make sure you have installed the latest version of [node.js](https://nodejs.org/) (You may need to restart your computer after this step). 

From NPM for use as a command line app:

	npm install rapydscript-ns -g

From NPM for use in your own node project:

	npm install rapydscript-ns

From Git:

	git clone https://github.com/ficocelliguy/rapydscript-ns.git
	cd rapydscript-ns
	sudo npm link .
	npm install  # This will automatically install the dependencies for RapydScript

If you're using OSX, you can probably use the same commands (let me know if
that's not the case). If you're using Windows, you should be able to follow
similar commands after installing node.js, npm and git on your system.


Compilation
-----------
Once you have installed RapydScript, compiling your application is as simple as
running the following command:

	rapydscript [options] <location of main file>

By default this will dump the output to STDOUT, but you can specify the output
file using `--output` option. The generated file can then be referenced in your
html page the same way as you would with a typical JavaScript file. If you're
only using RapydScript for classes and functions, then you're all set. For more
help, use ```rapydscript -h```.

Getting Started
---------------

RapydScript comes with its own Read-Eval-Print-Loop (REPL). Just run
``rapydscript`` without any arguments to get started trying out the code
snippets below.

Like JavaScript, RapydScript can be used to create anything from a quick
function to a complex web-app. RapydScript can access anything regular
JavaScript can, in the same manner. Let's say we want to write a function that
greets us with a "Hello World" pop-up. The following code will do it:

```python
def greet():
	alert("Hello World!")
```

Once compiled, the above code will turn into the following JavaScript:

```javascript
function greet() {
	alert("Hello World!");
}
```

Now you can reference this function from other JavaScript or the page itself
(using "onclick", for example). For our next example, let's say you want a
function that computes factorial of a number:

```python
def factorial(n):
	if n == 0:
		return 1
	return n * factorial(n-1)
```

Now all we need is to tie it into our page so that it's interactive. Let's add an input field to the page body and a cell for displaying the factorial of the number in the input once the input loses focus.

```html
	<input id="user-input" onblur="computeFactorial()"></input>
	<div id="result"></div>
```

**NOTE:** To complement RapydScript, I have also written RapydML (<https://bitbucket.org/pyjeon/rapydml>), which is a pre-compiler for HTML (just like RapydScript is a pre-compiler for JavaScript). 

Now let's implement computeFactorial() function in RapydScript:

```python
def computeFactorial():
	n = document.getElementById("user-input").value
	document.getElementById("result").innerHTML = factorial(n)
```

Again, notice that we have access to everything JavaScript has access to, including direct DOM manipulation. Once compiled, this function will look like this:

```javascript
function computeFactorial() {
	var n;
	n = document.getElementById("user-input").value;
	document.getElementById("result").innerHTML = factorial(n);
}
```

Notice that RapydScript automatically declares variables in local scope when
you try to assign to them. This not only makes your code shorter, but saves you
from making common JavaScript mistake of overwriting a global. For more
information on controlling variable scope, see `Scope Control` section.


Leveraging other APIs
---------------------

Aside from Python-like stdlib, RapydScript does not have any of its own APIs.
Nor does it need to, there are already good options available that we can
leverage instead. If we wanted, for example, to rewrite the above factorial
logic using jQuery, we could easily do so:

```python
def computeFactorial():
	n = $("#user-input").val()
	$("#result").text(factorial(n))
```

Many of these external APIs, however, take object literals as input. Like with
JavaScript, you can easily create those with RapydScript, the same way you
would create a dictionary in Python:

```javascript
styles = {
	'background-color':	'#ffe',
	'border-left':		'5px solid #ccc',
	'width':			50,
}
```

Now you can pass it to jQuery:

```python
$('#element').css(styles)
```

Another feature of RapydScript is ability to have functions as part of your
object literal. JavaScript APIs often take callback/handler functions as part
of their input parameters, and RapydScript lets you create such object literal
without any quirks/hacks:

```js
params = {
	'width':	50,
	'height':	30,
	'onclick':	def(event):
		alert("you clicked me"),
	'onmouseover':	def(event):
		$(this).css('background', 'red')
	,
	'onmouseout':	def(event):
		# reset the background
		$(this).css('background', '')
}
```

Note the comma on a new line following a function declaration, it needs to be
there to let the compiler know there are more attributes in this object
literal, yet it can't go on the same line as the function since it would get
parsed as part of the function block. Like Python, however, RapydScript
supports new-line shorthand using a `;`, which you could use to place the comma
on the same line:

```js
hash = {
	'foo':	def():
		print('foo');,
	'bar':	def():
		print('bar')
}
```

It is because of easy integration with JavaScript's native libraries that RapydScript keeps its own libraries to a minimum. 

Anonymous Functions
-------------------

Like JavaScript, RapydScript allows the use of anonymous functions. In fact,
you've already seen the use of anonymous functions in previous section when
creating an object literal ('onmouseover' and 'onmouseout' assignments). Unlike
Python's `lambda`, anonymous functions created with `def` are not limited to a
single expression. The following two function declarations are equivalent:

```js
def factorial(n):
	if n == 0:
		return 1
	return n * factorial(n-1)

factorial = def(n):
	if n == 0:
		return 1
	return n * factorial(n-1)
```

This might not seem like much at first, but if you're familiar with JavaScript,
you know that this can be extremely useful to the programmer, especially when
dealing with nested functions, which are a bit syntactically awkward in Python
(it's not immediately obvious that those can be copied and assigned to other
objects). To illustrate the usefulness, let's create a method that creates and
returns an element that changes color while the user keeps the mouse pressed on
it.

```js
def makeDivThatTurnsGreen():
	div = $('<div></div>')
	turnGreen = def(event):
		div.css('background', 'green')
	div.mousedown(turnGreen)
	resetColor = def(event):
		div.css('background', '')
	div.mouseup(resetColor)
	return div
```

At first glance, anonymous functions might not seem that useful. We could have
easily created nested functions and assigned them instead. By using anonymous
functions, however, we can quickly identify that these functions will be bound
to a different object. They belong to the div, not the main function that
created them, nor the logic that invoked it. The best use case for these is
creating an element inside another function/object without getting confused
which object the function belongs to.

Additionally, as you already noticed in the previous section, anonymous
functions can be used to avoid creating excessive temporary variables and make
your code cleaner:

```js
math_ops = {
	'add':	def(a, b): return a+b;,
	'sub':	def(a, b): return a-b;,
	'mul':	def(a, b): return a*b;,
	'div':	def(a, b): return a/b;,
	'roots':	def(a, b, c):
		r = Math.sqrt(b*b - 4*a*c)
		d = 2*a
		return (-b + r)/d, (-b - r)/d
}
```

Note that the example puts the function header (def()) and content on the same
line (function inlining). This is a feature of RapydScript that can be used
to make the code cleaner in cases like the example above. You can also use it 
in longer functions by chaining statements together using `;`.


Lambda Expressions
------------------

RapydScript supports Python's `lambda` keyword for creating single-expression
anonymous functions inline. The syntax is identical to Python:

```
lambda arg1, arg2, ...: expression
```

The body must be a single expression whose value is implicitly returned. For
multi-statement bodies, use `def` instead.

```py
# Simple lambda assigned to a variable
double = lambda x: x * 2
double(5)  # → 10

# Lambda with multiple arguments
add = lambda a, b: a + b
add(3, 4)  # → 7

# Lambda with no arguments
forty_two = lambda: 42

# Lambda with a ternary body
abs_val = lambda x: x if x >= 0 else -x
abs_val(-5)  # → 5

# Lambda used inline (e.g. as a sort key)
nums = [3, 1, 2]
nums.sort(lambda a, b: a - b)
# nums is now [1, 2, 3]

# Lambda with a default argument value
greet = lambda name='world': 'hello ' + name
greet()         # → 'hello world'
greet('alice')  # → 'hello alice'

# Lambda with *args
total = lambda *args: sum(args)
total(1, 2, 3)  # → 6

# Closure: lambda captures variables from the enclosing scope
def make_adder(n):
    return lambda x: x + n
add5 = make_adder(5)
add5(3)   # → 8

# Nested lambdas
mult = lambda x: lambda y: x * y
mult(3)(4)  # → 12
```

`lambda` is purely syntactic sugar — `lambda x: expr` compiles to the same
JavaScript as `def(x): return expr`. Use `def` when the body spans multiple
lines or needs statements.

Decorators
----------
Like Python, RapydScript supports decorators.

```py
def makebold(fn):
	def wrapped():
		return "<b>" + fn() + "</b>"
	return wrapped

def makeitalic(fn):
	def wrapped():
		return "<i>" + fn() + "</i>"
	return wrapped

@makebold
@makeitalic
def hello():
	return "hello world"

hello() # returns "<b><i>hello world</i></b>"
```

Class decorators are also supported with the caveat that the class properties
must be accessed via the prototype property. For example:

```py
def add_x(cls):
	cls.prototype.x = 1

@add_x
class A:
   pass

print(A.x)  # will print 1
```


Self-Executing Functions
------------------------
RapydScript wouldn't be useful if it required work-arounds for things that
JavaScript handled easily. If you've worked with JavaScript or jQuery before,
you've probably seen the following syntax:

```js
(function(args){
	// some logic here
})(args)
```

This code calls the function immediately after declaring it instead of
assigning it to a variable. Python doesn't have any way of doing this. The
closest work-around is this:

```py
def tmp(args):
	# some logic here
tmp.__call__(args)
```

While it's not horrible, it did litter our namespace with a temporary variable.
If we have to do this repeatedly, this pattern does get annoying. This is where
RapydScript decided to be a little unorthodox and implement the JavaScript-like
solution:

```js
(def(args):
	# some logic here
)()
```

A close cousin of the above is the following code (passing current scope to the function being called):

```js
function(){
	// some logic here
}.call(this);
```

With RapydScript equivalent of:

```js
def():
	# some logic here
.call(this)
```

There is also a third alternative, that will pass the arguments as an array:

```js
def(a, b):
	# some logic here
.apply(this, [a, b])
```


Chaining Blocks
---------------
As seen in previous section, RapydScript will bind any lines beginning with `.` to the outside of the block with the matching indentation. This logic isn't limited to the `.call()` method, you can use it with `.apply()` or any other method/property the function has assigned to it. This can be used for jQuery as well:

```js
$(element)
.css('background-color', 'red')
.show()
```

The only limitation is that the indentation has to match, if you prefer to indent your chained calls, you can still do so by using the `\` delimiter:

```js
$(element)\
	.css('background-color', 'red')\
	.show()
```

This feature handles `do/while` loops as well:

```js
a = 0
do:
	print(a)
	a += 1
.while a < 1
```

Function calling with optional arguments
-------------------------------------------

RapydScript supports the same function calling format as Python. You can have
named optional arguments, create functions with variable numbers of arguments
and variable numbers of named arguments. Some examples will illustrate this
best:

```py
	def f1(a, b=2):
	   return [a, b]

	f1(1, 3) == f1(1, b=3) == [1, 3]

	def f2(a, *args):
		return [a, args]

	f2(1, 2, 3) == [1, [2, 3]]

	def f3(a, b=2, **kwargs):
	    return [a, b, kwargs]

	f3(1, b=3, c=4) == [1, 3, {c:4}]

	def f4(*args, **kwargs):
		return [args, kwargs]

	f4(1, 2, 3, a=1, b=2):
		return [[1, 2, 3], {a:1, b:2}]
```

### Positional-only and keyword-only parameters

RapydScript supports Python's ``/`` and ``*`` parameter separators:

- **``/`` (positional-only separator)**: parameters listed before ``/`` can only
  be passed positionally — they cannot be named at the call site.
- **``*`` (keyword-only separator)**: parameters listed after a bare ``*`` can
  only be passed by name — they cannot be passed positionally.

```py
	def greet(name, /, greeting="Hello", *, punctuation="!"):
	    return greeting + ", " + name + punctuation

	greet("Alice")                          # Hello, Alice!
	greet("Bob", greeting="Hi")             # Hi, Bob!
	greet("Carol", punctuation=".")         # Hello, Carol.
	greet("Dave", greeting="Hey", punctuation="?")  # Hey, Dave?

	# name is positional-only: greet(name="Alice") would silently ignore the kwarg
	# punctuation is keyword-only: must be passed as punctuation="."
```

The two separators can be combined, and each section can have its own default
values.  All combinations supported by Python 3.8+ are accepted.

RapydScript is lenient: passing a positional-only parameter by keyword will not
raise a ``TypeError`` at runtime (the named value is silently ignored), and
passing a keyword-only parameter positionally will not raise an error either.
This is consistent with RapydScript's general approach of favouring
interoperability over strict enforcement.

The Monaco language service correctly shows ``/`` and ``*`` separators in
signature help and hover tooltips.

One difference between RapydScript and Python is that RapydScript is not as
strict as Python when it comes to validating function arguments. This is both
for performance and to make it easier to interoperate with other JavaScript
libraries. So if you do not pass enough arguments when calling a function, the
extra arguments will be set to undefined instead of raising a TypeError, as in
Python. Similarly, when mixing ``*args`` and optional arguments, RapydScript
will not complain if an optional argument is specified twice.

When creating callbacks to pass to other JavaScript libraries, it is often the
case that the external library expects a function that receives an *options
object* as its last argument. There is a convenient decorator in the standard
library that makes this easy:

```py
@options_object
def callback(a, b, opt1=default1, opt2=default2):
	console.log(opt1, opt2)

callback(1, 2, {'opt1':'x', 'opt2':'y'})  # will print x, y
```

Now when you pass callback into the external library and it is called with an
object containing options, they will be automatically converted by RapydScript
into the names optional parameters you specified in the function definition.


Inferred Tuple Packing/Unpacking
--------------------------------
Like Python, RapydScript allows inferred tuple packing/unpacking and assignment. For 
example, if you wanted to swap two variables, the following is simpler than explicitly 
declaring a temporary variable:

```py
a, b = b, a
```

Likewise, if a function returns multiple variables, it's cleaner to say:

```py
a, b, c = fun()
```

rather than:

```py
tmp = fun()
a = tmp[0]
b = tmp[1]
c = tmp[2]
```

Since JavaScript doesn't have tuples, RapydScript uses arrays for tuple packing/unpacking behind the scenes, but the functionality stays the same. Note that unpacking only occurs when you're assigning to multiple arguments:

```py
a, b, c = fun()		# gets unpacked
tmp = fun()			# no unpacking, tmp will store an array of length 3
```

Unpacking can also be done in `for` loops (which you can read about in later section):

```py
for index, value in enumerate(items):
	print(index+': '+value)
```

Tuple packing is the reverse operation, and is done to the variables being assigned, rather than the ones being assigned to. This can occur during assignment or function return:

```py
def fun():
	return 1, 2, 3
```

To summarize packing and unpacking, it's basically just syntax sugar to remove obvious assignment logic that would just litter the code. For example, the swap operation shown in the beginning of this section is equivalent to the following code:

```py
tmp = [b, a]
a = tmp[0]
b = tmp[1]
```

RapydScript also supports Python's **starred assignment** (`a, *b, c = iterable`), which collects the remaining elements into a list. The starred variable can appear at any position — front, middle, or end:

```py
first, *rest = [1, 2, 3, 4]       # first=1, rest=[2, 3, 4]
*init, last = [1, 2, 3, 4]        # init=[1, 2, 3], last=4
head, *mid, tail = [1, 2, 3, 4, 5] # head=1, mid=[2, 3, 4], tail=5
```

Starred assignment works with any iterable, including generators and strings (which are unpacked character by character). The starred variable always receives a list, even if it captures zero elements.

**Explicit tuple literals** using parentheses work the same as in Python and compile to JavaScript arrays:

```py
empty   = ()            # []
single  = (42,)         # [42]  — trailing comma required for single-element tuple
pair    = (1, 2)        # [1, 2]
triple  = ('a', 'b', 'c')  # ['a', 'b', 'c']
nested  = ((1, 2), (3, 4))  # [[1, 2], [3, 4]]
```

A parenthesised expression without a trailing comma is **not** a tuple — `(x)` is just `x`.  Add a comma to make it one: `(x,)`.

Tuple literals work naturally everywhere arrays do: as return values, function arguments, in `isinstance` checks, and in destructuring assignments:

```py
def bounding_box(points):
    return (min(p[0] for p in points), max(p[0] for p in points))

ok  = isinstance(value, (int, str))   # tuple of types

(a, b), c = (1, 2), 3
```

Operators and keywords
------------------------

RapydScript uses the python form for operators and keywords. Below is the
mapping from RapydScript to JavaScript.

Keywords:

	RapydScript		JavaScript
	
	None			null
	False			false
	True			true
	...			ρσ_Ellipsis (the Ellipsis singleton)
	undefined		undefined
	this			this

Operators:

	RapydScript		JavaScript

	and				&&
	or				||
	not				!
	is				===
	is not			!==
	+=1				++
	-=1				--
	**				Math.pow()
	**=				x = Math.pow(x, y)

All Python augmented assignment operators are supported: `+=`, `-=`, `*=`, `/=`, `//=`, `**=`, `%=`, `>>=`, `<<=`, `|=`, `^=`, `&=`.

Admittedly, `is` is not exactly the same thing in Python as `===` in JavaScript, but JavaScript is quirky when it comes to comparing objects anyway.


Literal JavaScript
-----------------------

In rare cases RapydScript might not allow you to do what you need to, and you
need access to pure JavaScript, this is particularly useful for performance
optimizations in inner loops. When that's the case, you can use a *verbatim
string literal*.  That is simply a normal RapydScript string prefixed with the
```v``` character. Code inside a verbatim string literal is not a sandbox, you
can still interact with it from normal RapydScript:

```py
v'a = {foo: "bar", baz: 1};'
print(a.foo)	# prints "bar"

for v'i = 0; i < arr.length; i++':
   print (arr[i])
```

Containers (lists/sets/dicts)
------------------------------

### Lists

Lists in RapydScript are almost identical to lists in Python, but are also
native JavaScript arrays. The ``sort()`` and ``pop()`` methods behave exactly
as in Python: ``sort()`` performs a numeric sort (in-place, with optional ``key``
and ``reverse`` arguments) and ``pop()`` performs a bounds-checked pop (raises
``IndexError`` for out-of-bounds indices). If you need the native JavaScript
behavior for interop with external JS libraries, use ``jssort()`` (lexicographic
sort) and ``jspop()`` (no bounds check, always pops the last element). The old
``pysort()`` and ``pypop()`` names are kept as backward-compatible aliases.

Note that even list literals in RapydScript create Python-like list objects,
and you can also use the builtin ``list()`` function to create lists from other
iterable objects, just as you would in Python. You can create a RapydScript
list from a plain native JavaScript array by using the ``list_wrap()`` function,
like this:

```py
a = v'[1, 2]'
pya = list_wrap(a)
 # Now pya is a python like list object that satisfies pya === a
```

### List Concatenation

The `+` operator concatenates two lists and returns a new list, exactly as in Python:

```py
a = [1, 2]
b = [3, 4]
c = a + b   # [1, 2, 3, 4]  — a and b are unchanged
```

The `+=` operator extends a list in-place (the original list object is mutated):

```py
a = [1, 2]
ref = a      # ref and a point to the same list
a += [3, 4]  # mutates a in-place
print(ref)   # [1, 2, 3, 4]  — ref sees the update
```

No special flag is required. The `+` operator compiles to a lightweight helper
(`ρσ_list_add`) that uses `Array.concat` for lists and falls back to native JS
`+` for numbers and strings.

### Sets

Sets in RapydScript are identical to those in python. You can create them using
set literals or comprehensions and all set operations are supported. You can
store any object in a set. For primitive types (strings, numbers) the value is
used for equality; for class instances, object identity (``is``) is used by
default unless the class defines a ``__hash__`` method.

Note that sets are not a subclass of the ES 6 JavaScript Set object, however,
they do use this object as a backend, when available. You can create a set from
any enumerable container, like you would in python

```py
s = set(list or other set or string)
```

You can also wrap an existing JavaScript Set object efficiently, without
creating a copy with:

```py
js_set = Set()
py_set = set_wrap(js_set)
```

Note that using non-primitive objects as set members does not behave the
same way as in Python. For example:

```py
a = [1, 2]
s = {a}
a in s  # True
[1, 2] in s # False
```

This is because list identity (not value) determines set membership for mutable
objects. Define ``__hash__`` on your own classes to control set/dict membership.

### Dicts

dicts are the most different in RapydScript, from Python. This is because
RapydScript uses the JavaScript Object as a dict, for compatibility with
external JavaScript libraries and performance. This means there are several
differences between RapydScript dicts and Python dicts.

    - You can only use primitive types (strings/numbers) as keys in the dict
    - If you use numbers as keys, they are auto-converted to strings
    - You can access the keys of the dict as attributes of the dict object
    - Trying to access a non-existent key returns ``undefined`` instead of
      raising a KeyError
    - dict objects do not have the same methods as python dict objects:
      ``items(), keys(), values(), get(), pop(), etc.`` You can however use
      RapydScript dict objects in ```for..in``` loops.

Fortunately, there is a builtin ```dict``` type that behaves just like Python's
```dict``` with all the same methods. The ``dict_literals`` and
``overload_getitem`` flags are **on by default**, so dict literals and the
``[]`` operator already behave like Python:

```py
a = {1:1, 2:2}
a[1]  # == 1
a[3] = 3
list(a.keys()) == [1, 2, 3]
a['3'] # raises a KeyError as this is a proper python dict, not a JavaScript object
```

These are *scoped flags* — local to the scope where they appear. You can
disable them for a region of code using the ``no_`` prefix:

```py
a = {1:1, 2:2}
isinstance(a, dict) == True
from __python__ import no_dict_literals, no_overload_getitem
a = {1:1, 2:2}
isinstance(a, dict) == False # a is a normal JavaScript object
```

### List spread literals

RapydScript supports Python's `*expr` spread syntax inside list literals.
One or more `*expr` items can appear anywhere, interleaved with ordinary
elements:

```py
a = [1, 2, 3]
b = [4, 5]

# Spread at the end
result = [0, *a]            # [0, 1, 2, 3]

# Spread in the middle
result = [0, *a, *b, 6]     # [0, 1, 2, 3, 4, 5, 6]

# Copy a list
copy = [*a]                 # [1, 2, 3]

# Unpack a string
chars = [*'hello']          # ['h', 'e', 'l', 'l', 'o']
```

Spread works on any iterable (lists, strings, generators, `range()`).
The result is always a new Python list.  Translates to JavaScript's
`[...expr]` spread syntax.

### Set spread literals

The same `*expr` syntax works inside set literals `{...}`:

```py
a = [1, 2, 3]
b = [3, 4, 5]

s = {*a, *b}                # set([1, 2, 3, 4, 5]) — duplicates removed
s2 = {*a, 10}               # set([1, 2, 3, 10])
```

Translates to `ρσ_set([...a, ...b])`.

### `**expr` in function calls

`**expr` in a function call now accepts any expression, not just a plain
variable name:

```py
def f(x=0, y=0):
    return x + y

opts = {'x': 10, 'y': 20}
f(**opts)                   # 30  (variable — always worked)
f(**{'x': 1, 'y': 2})      # 3   (dict literal)
f(**cfg.defaults)           # uses attribute access result
f(**get_opts())             # uses function call result
```

### Dict merge literals

RapydScript supports Python's `{**d1, **d2}` dict merge (spread) syntax.
One or more `**expr` items can appear anywhere inside a `{...}` literal,
interleaved with ordinary `key: value` pairs:

```py
defaults = {'color': 'blue', 'size': 10}
overrides = {'size': 20}

# Merge two dicts — later items win
merged = {**defaults, **overrides}
# merged == {'color': 'blue', 'size': 20}

# Mix spread with literal key-value pairs
result = {**defaults, 'weight': 5}
# result == {'color': 'blue', 'size': 10, 'weight': 5}
```

This works for both plain JavaScript-object dicts and Python `dict` objects
(``dict_literals`` is on by default):

```py
pd1 = {'a': 1}
pd2 = {'b': 2}
merged = {**pd1, **pd2}   # isinstance(merged, dict) == True
```

The spread items are translated using `Object.assign` for plain JS objects
and `dict.update()` for Python dicts.

### Dict merge operator `|` and `|=` (Python 3.9+)

Python dicts support the `|` (merge) and `|=` (update in-place) operators
(requires ``overload_operators`` and ``dict_literals``, both on by default):

```py
d1 = {'x': 1, 'y': 2}
d2 = {'y': 99, 'z': 3}

# Create a new merged dict — right-side values win on key conflict
merged = d1 | d2   # {'x': 1, 'y': 99, 'z': 3}

# Update d1 in place
d1 |= d2           # d1 is now {'x': 1, 'y': 99, 'z': 3}
```

`d1 | d2` creates a new dict (neither operand is mutated).
`d1 |= d2` merges `d2` into `d1` and returns `d1`.

Without `overload_operators` the `|` symbol is bitwise OR — use
`{**d1, **d2}` spread syntax as an alternative if the flag is disabled.


### Arithmetic operator overloading

RapydScript supports Python-style arithmetic operator overloading via the
``overload_operators`` flag, which is **on by default**:

```py
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)

    def __neg__(self):
        return Vector(-self.x, -self.y)

a = Vector(1, 2)
b = Vector(3, 4)
c = a + b   # calls a.__add__(b)  →  Vector(4, 6)
d = -a      # calls a.__neg__()   →  Vector(-1, -2)
```

The supported dunder methods are:

| Expression | Forward method  | Reflected method  |
|------------|-----------------|-------------------|
| `a + b`    | `__add__`       | `__radd__`        |
| `a - b`    | `__sub__`       | `__rsub__`        |
| `a * b`    | `__mul__`       | `__rmul__`        |
| `a / b`    | `__truediv__`   | `__rtruediv__`    |
| `a // b`   | `__floordiv__`  | `__rfloordiv__`   |
| `a % b`    | `__mod__`       | `__rmod__`        |
| `a ** b`   | `__pow__`       | `__rpow__`        |
| `a & b`    | `__and__`       | `__rand__`        |
| `a \| b`   | `__or__`        | `__ror__`         |
| `a ^ b`    | `__xor__`       | `__rxor__`        |
| `a << b`   | `__lshift__`    | `__rlshift__`     |
| `a >> b`   | `__rshift__`    | `__rrshift__`     |
| `-a`       | `__neg__`       |                   |
| `+a`       | `__pos__`       |                   |
| `~a`       | `__invert__`    |                   |

Augmented assignment (``+=``, ``-=``, etc.) first tries the in-place method
(``__iadd__``, ``__isub__``, …) and then falls back to the binary method.

If neither operand defines the relevant dunder method the operation falls back
to the native JavaScript operator, so plain numbers, strings, and booleans
continue to work as expected with no performance penalty when no dunder method
is defined.

When `overload_operators` is active, string and list repetition with `*` works just like Python:

```py
'ha' * 3      # 'hahaha'
3 * 'ha'      # 'hahaha'
[0] * 4       # [0, 0, 0, 0]
[1, 2] * 2    # [1, 2, 1, 2]
```

Because the dispatch adds one or two property lookups per operation, you can
disable it in scopes where it is not needed with
``from __python__ import no_overload_operators``.

The ``collections.Counter`` class defines ``__add__``, ``__sub__``, ``__or__``,
and ``__and__``. With ``overload_operators`` you can use the natural operator
syntax:

```py
from collections import Counter

c1 = Counter('aab')
c2 = Counter('ab')
c3 = c1 + c2   # {'a': 3, 'b': 2}
c4 = c1 - c2   # {'a': 1}
c5 = c1 | c2   # union  (max) → {'a': 2, 'b': 1}
c6 = c1 & c2   # intersection (min) → {'a': 1, 'b': 1}
```

### Container comparisons

Container equality (the `==` and `!=` operators) work for lists and sets and
RapydScript dicts (but not arbitrary javascript objects). You can also define
the ``__eq__(self, other)`` method in your classes to have these operators work
for your own types.

RapydScript does not overload the ordering operators ```(>, <, >=,
<=)``` as doing so would be a big performance impact (function calls in
JavaScript are very slow). So using them on containers is useless.

Chained comparisons work just like Python — each middle operand is evaluated only once:

```py
# All of these work correctly, including mixed-direction chains
assert 1 < 2 < 3      # True
assert 1 < 2 > 0      # True  (1<2 AND 2>0)
assert 1 < 2 > 3 == False  # 1<2 AND 2>3 = True AND False = False
```

### Python Truthiness and `__bool__`

RapydScript uses Python truthiness semantics by default (``truthiness`` is
**on by default**):

When this flag is active:

- **Empty containers are falsy**: `[]`, `{}`, `set()`, `''`, `0`, `None` are all falsy.
- **`__bool__` is dispatched**: objects with a `__bool__` method control their truthiness.
- **`__len__` is used**: objects with `__len__` are falsy when `len(obj) == 0`.
- **`and`/`or` return operand values** (not booleans), just like Python.
- **All condition positions** (`if`, `while`, `assert`, `not`, ternary) use Python semantics.

```py
class Empty:
    def __bool__(self): return False

if not []:          # True — [] is falsy
    print('empty')

x = [] or 'default'   # x == 'default'
y = [1] or 'default'  # y == [1]
z = [1] and 'ok'      # z == 'ok'
```

The flag is **scoped** — it applies until the end of the enclosing
function or class body. Use `from __python__ import no_truthiness` to
disable it in a sub-scope where JavaScript truthiness is needed.

### Callable Objects (`__call__`)

Any class that defines `__call__` can be invoked directly with `obj(args)`,
just like Python callable objects:

```python
class Multiplier:
    def __init__(self, factor):
        self.factor = factor
    def __call__(self, x):
        return self.factor * x

triple = Multiplier(3)
triple(7)   # 21 — dispatches to triple.__call__(7)
```

`callable(obj)` returns `True` when `__call__` is defined. The dispatch is
automatic for all direct function-call expressions that are simple names
(i.e. not method accesses like `obj.method()`).

### `frozenset`

RapydScript provides a full `frozenset` builtin — an immutable, unordered
collection of unique elements, identical to Python's `frozenset`.

```python
fs = frozenset([1, 2, 3])
len(fs)          # 3
2 in fs          # True
isinstance(fs, frozenset)  # True

# Set operations return new frozensets
a = frozenset([1, 2, 3])
b = frozenset([2, 3, 4])
a.union(b)                 # frozenset({1, 2, 3, 4})
a.intersection(b)          # frozenset({2, 3})
a.difference(b)            # frozenset({1})
a.symmetric_difference(b)  # frozenset({1, 4})

a.issubset(frozenset([1, 2, 3, 4]))   # True
a.issuperset(frozenset([1, 2]))        # True
a.isdisjoint(frozenset([5, 6]))        # True

# Compares equal to a set with the same elements
frozenset([1, 2]).__eq__({1, 2})  # True
```

Mutation methods (`add`, `remove`, `discard`, `clear`, `update`) are not
present on `frozenset` instances, enforcing immutability at the API level.
`frozenset` objects can be iterated and copied with `.copy()`.

### `bytes` and `bytearray`

RapydScript provides `bytes` (immutable) and `bytearray` (mutable) builtins
that match Python's semantics and are backed by plain JS arrays of integers
in the range 0–255.

#### `b'...'` bytes literals

RapydScript supports Python `b'...'` bytes literal syntax.  The prefix may be
`b` or `B` (and `rb`/`br` for raw bytes where backslash sequences are not
interpreted).  Adjacent bytes literals are automatically concatenated, just
like adjacent string literals.

```python
b'Hello'              # bytes([72, 101, 108, 108, 111])
b'\x00\xff'           # bytes([0, 255])  — hex escape sequences work
b'\n\t\r'             # bytes([10, 9, 13]) — control-char escapes work
b'foo' b'bar'         # bytes([102, 111, 111, 98, 97, 114])  — concatenation
rb'\n\t'              # bytes([92, 110, 92, 116])  — raw: backslashes literal
B'ABC'                # bytes([65, 66, 67])  — uppercase B also accepted
```

Each `b'...'` literal is compiled to a `bytes(str, 'latin-1')` call, so the
full `bytes` API is available on the result.

#### Construction

```python
bytes()                      # empty bytes
bytes(4)                     # b'\x00\x00\x00\x00'  (4 zero bytes)
b'\x00\x00\x00\x00'          # same — bytes literal syntax
bytes([72, 101, 108, 111])   # b'Hello'
b'Hell\x6f'                  # same — mix of ASCII and hex escapes
bytes('Hello', 'utf-8')      # encode a string
bytes('ABC', 'ascii')        # ASCII / latin-1 encoding also accepted
bytes.fromhex('48656c6c6f')  # from hex string → b'Hello'

bytearray()                  # empty mutable byte sequence
bytearray(3)                 # bytearray(b'\x00\x00\x00')
bytearray([1, 2, 3])         # from list of ints
bytearray('Hi', 'utf-8')     # from string
bytearray(some_bytes)        # mutable copy of a bytes object
```

`Uint8Array` values may also be passed as the source argument.

#### Common operations (both `bytes` and `bytearray`)

```python
b = bytes('Hello', 'utf-8')

len(b)                        # 5
b[0]                          # 72  (integer)
b[-1]                         # 111
b[1:4]                        # bytes([101, 108, 108])  (slice → new bytes)
b[::2]                        # every other byte

b + bytes([33])               # concatenate → b'Hello!'
b * 2                         # repeat     → b'HelloHello'
72 in b                       # True  (integer membership)
bytes([101, 108]) in b        # True  (subsequence membership)
b == bytes([72, 101, 108, 108, 111])  # True

b.hex()                       # '48656c6c6f'
b.hex(':', 2)                 # '48:65:6c:6c:6f'  (separator every 2 bytes)
b.decode('utf-8')             # 'Hello'
b.decode('ascii')             # works for ASCII-range bytes

b.find(bytes([108, 108]))     # 2
b.index(101)                  # 1
b.rfind(108)                  # 3
b.count(108)                  # 2
b.startswith(bytes([72]))     # True
b.endswith(bytes([111]))      # True
b.split(bytes([108]))         # [b'He', b'', b'o']
b.replace(bytes([108]), bytes([76]))  # b'HeLLo'
b.strip()                     # strip leading/trailing whitespace bytes
b.upper()                     # b'HELLO'
b.lower()                     # b'hello'
bytes(b' ').join([bytes('a', 'ascii'), bytes('b', 'ascii')])  # b'a b'

repr(b)                       # "b'Hello'"
isinstance(b, bytes)          # True
isinstance(bytearray([1]), bytes)  # True  (bytearray is a subclass of bytes)
```

#### `bytearray`-only mutation methods

```python
ba = bytearray([1, 2, 3])
ba[0] = 99                    # item assignment
ba[1:3] = bytes([20, 30])     # slice assignment
ba.append(4)                  # add one byte
ba.extend([5, 6])             # add multiple bytes
ba.insert(0, 0)               # insert at index
ba.pop()                      # remove and return last byte (or ba.pop(i))
ba.remove(20)                 # remove first occurrence of value
ba.reverse()                  # reverse in place
ba.clear()                    # remove all bytes
ba += bytearray([7, 8])       # in-place concatenation
```

### `issubclass`

`issubclass(cls, classinfo)` checks whether a class is a subclass of another
class (or any class in a tuple of classes).  Every class is considered a
subclass of itself.

```python
class Animal: pass
class Dog(Animal): pass
class Poodle(Dog): pass
class Cat(Animal): pass

issubclass(Dog, Animal)            # True
issubclass(Poodle, Animal)         # True — transitive
issubclass(Poodle, Dog)            # True
issubclass(Dog, Dog)               # True — a class is its own subclass
issubclass(Cat, Dog)               # False
issubclass(Animal, Dog)            # False — parent is not a subclass of child

# tuple form — True if cls is a subclass of any entry
issubclass(Dog, (Cat, Animal))     # True
issubclass(Poodle, (Cat, Dog))     # True
```

`TypeError` is raised when either argument is not a class.

### `hash`

`hash(obj)` returns an integer hash value for an object, following Python
semantics:

| Type | Hash rule |
|---|---|
| `None` | `0` |
| `bool` | `1` for `True`, `0` for `False` |
| `int` / whole `float` | the integer value itself |
| other `float` | derived from the bit pattern |
| `str` | djb2 algorithm — stable within a process |
| object with `__hash__` | dispatches to `__hash__()` |
| class instance (no `__hash__`) | stable identity hash (assigned on first call) |
| class with `__eq__` but no `__hash__` | `TypeError` (unhashable — Python semantics) |
| `list` | `TypeError: unhashable type: 'list'` |
| `set` | `TypeError: unhashable type: 'set'` |
| `dict` | `TypeError: unhashable type: 'dict'` |

```python
hash(None)        # 0
hash(True)        # 1
hash(42)          # 42
hash(3.0)         # 3   (whole float → same as int)
hash('hello')     # stable integer

class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    def __hash__(self):
        return self.x * 31 + self.y

hash(Point(1, 2))  # 33

# Python semantics: __eq__ without __hash__ → unhashable
class Bar:
    def __eq__(self, other):
        return True
hash(Bar())  # TypeError: unhashable type: 'Bar'
```

### Attribute-Access Dunders

RapydScript supports the four Python attribute-interception hooks:
`__getattr__`, `__setattr__`, `__delattr__`, and `__getattribute__`.
When a class defines any of them, instances are automatically wrapped in a
JavaScript `Proxy` that routes attribute access through the hooks — including
accesses that occur inside `__init__`.

| Hook | When called |
|---|---|
| `__getattr__(self, name)` | Fallback — only called when normal lookup finds nothing |
| `__setattr__(self, name, value)` | Every attribute assignment (including `self.x = …` in `__init__`) |
| `__delattr__(self, name)` | Every `del obj.attr` |
| `__getattribute__(self, name)` | Every attribute read (overrides normal lookup) |

To bypass the hooks from within the hook itself (avoiding infinite recursion),
use the `object.*` bypass functions:

| Python idiom | Compiled form | Effect |
|---|---|---|
| `object.__setattr__(self, name, val)` | `ρσ_object_setattr(self, name, val)` | Set attribute directly, bypassing `__setattr__` |
| `object.__getattribute__(self, name)` | `ρσ_object_getattr(self, name)` | Read attribute directly, bypassing `__getattribute__` |
| `object.__delattr__(self, name)` | `ρσ_object_delattr(self, name)` | Delete attribute directly, bypassing `__delattr__` |

Subclasses automatically inherit proxy wrapping from their parent class — if
`Base` defines `__getattr__`, all `Child(Base)` instances are also Proxy-wrapped.

```py
class Validated:
    """Reject negative values at assignment time."""
    def __setattr__(self, name, value):
        if jstype(value) is 'number' and value < 0:
            raise ValueError(name + ' must be non-negative')
        object.__setattr__(self, name, value)

v = Validated()
v.x = 5    # ok
v.x = -1   # ValueError: x must be non-negative

class AttrProxy:
    """Log every attribute read."""
    def __init__(self):
        object.__setattr__(self, '_log', [])

    def __getattribute__(self, name):
        self._log.append(name)          # self._log goes through __getattribute__ too!
        return object.__getattribute__(self, name)
```

> **Proxy support required** — The hooks rely on `Proxy`, which is available
> in all modern browsers and Node.js ≥ 6. In environments that lack `Proxy`
> the class still works, but the hooks are silently bypassed.

Loops
-----
RapydScript's loops work like Python, not JavaScript. You can't, for example
use ```for(i=0;i<max;i++)``` syntax. You can, however, loop through arrays
using 'for ... in' syntax without worrying about the extra irrelevant
attributes regular JavaScript returns.

```py
animals = ['cat', 'dog', 'mouse', 'horse']
for animal in animals:
	print('I have a '+animal)
```
		
If you need to use the index in the loop as well, you can do so by using enumerate():

```py
for index, animal in enumerate(animals):
	print("index:"+index, "animal:"+animal)
```

`enumerate()` supports an optional `start` argument (default 0):

```py
for index, animal in enumerate(animals, 1):
	print(str(index) + '. ' + animal)  # 1-based numbering
```

Like in Python, `for` loops support an `else` clause that runs only when the loop completes without hitting a `break`:

```py
for animal in animals:
    if animal == 'cat':
        print('found a cat')
        break
else:
    print('no cat found')
```

This is useful for search patterns where you want to take an action only if the searched item was not found.

`while` loops also support an `else` clause, which runs when the condition becomes `False` (i.e. no `break` was executed):

```py
i = 0
while i < len(items):
    if items[i] == target:
        print('found at', i)
        break
    i += 1
else:
    print('not found')
```

Like in Python, if you just want the index, you can use range:

```py
for index in range(len(animals)):			# or range(animals.length)
	print("animal "+index+" is a "+animals[index])
```

When possible, RapydScript will automatically optimize the loop for you into
JavaScript's basic syntax, so you're not missing much by not being able to call
it directly.


List/Set/Dict Comprehensions
-------------------------------

RapydScript also supports comprehensions, using Python syntax. Instead of the following, for example:

```py
myArray = []
for index in range(1,20):
	if index*index % 3 == 0:
		myArray.append(index*index)
```

You could write this:

```py
myArray = [i*i for i in range(1,20) if i*i%3 == 0]
```

Similarly for set and dict comprehensions:

```py
myDict = {x:x+1 for x in range(20) if x > 2}
mySet = {i*i for i in range(1,20) if i*i%3 == 0}
```

Nested comprehensions (multiple `for` and `if` clauses) are also supported,
using the same syntax as Python:

```py
# Flatten a 2-D list
flat = [x for row in matrix for x in row]

# Cartesian product of two ranges
coords = [[i, j] for i in range(3) for j in range(3)]

# Filter across nested loops
evens = [x for row in [[1,2,3],[4,5,6]] for x in row if x % 2 == 0]

# Nested set/dict comprehensions work too
unique_sums = {x + y for x in range(4) for y in range(4)}
```

Any number of `for` clauses may be combined, each optionally followed by one or
more `if` conditions.

Builtin iteration functions: any() and all()
---------------------------------------------

RapydScript supports Python's `any()` and `all()` built-in functions with
identical semantics. Both work with arrays, strings, iterators, `range()` objects,
and any other iterable.

`any(iterable)` returns `True` if at least one element of the iterable is
truthy, and `False` if all elements are falsy or the iterable is empty:

```py
any([False, 0, '', 1])   # True
any([False, 0, None])    # False
any([])                  # False
any(range(3))            # True  (range produces 0, 1, 2 — 1 and 2 are truthy)
any(range(0))            # False (empty range)
```

`all(iterable)` returns `True` only if every element is truthy (or the iterable
is empty):

```py
all([1, 2, 3])           # True
all([1, 0, 3])           # False
all([])                  # True  (vacuously true)
all(range(1, 4))         # True  (1, 2, 3 — all truthy)
all(range(0, 3))         # False (range starts at 0, which is falsy)
```

Both functions short-circuit: `any()` stops as soon as it finds a truthy
element, and `all()` stops as soon as it finds a falsy element. This makes
them efficient even with large or lazy iterables.

They work naturally with list comprehensions for expressive one-liners:

```py
nums = [2, 4, 6, 8]
all([x > 0 for x in nums])   # True — all positive
any([x > 5 for x in nums])   # True — some greater than 5
all([x > 5 for x in nums])   # False — not all greater than 5
```

Both `any()` and `all()` compile to plain JavaScript function calls and are
always available without any import.

Strings
---------

For reasons of compatibility with external JavaScript and performance,
RapydScript does not make any changes to the native JavaScript string type.
However, all the useful Python string methods are available on the builtin
``str`` object. This is analogous to how the functions are available in the
``string`` module in Python 2.x.  For example,

```py
str.strip(' a ') == 'a'
str.split('a b') == ['a', 'b']
str.format('{0:02d} {n}', 1, n=2) == '01 2'
...
```

The `format(value[, spec])` builtin is also supported. It applies the Python
format-spec mini-language to a single value — the same mini-language that
follows `:` in f-strings and `str.format()` fields:

```py
format(42, '08b')     # '00101010'  — zero-padded binary
format(3.14159, '.2f') # '3.14'     — fixed-point
format('hi', '>10')   # '        hi' — right-aligned in 10-char field
format(42)            # '42'        — no spec: same as str(42)
```

Objects with a `__format__` method are dispatched to it in all three contexts
— `format(obj, spec)`, `str.format('{:spec}', obj)`, and `f'{obj:spec}'` —
matching Python's protocol exactly. Every user-defined class automatically
gets a default `__format__` that returns `str(self)` for an empty spec and
raises `TypeError` for any other spec, just like `object.__format__` in
Python:

```py
class Money:
    def __init__(self, amount):
        self.amount = amount
    def __str__(self):
        return str(self.amount)
    def __format__(self, spec):
        if spec == 'usd':
            return '$' + str(self.amount)
        return format(self.amount, spec)  # delegate numeric specs

m = Money(42)
format(m, 'usd')          # '$42'
str.format('{:usd}', m)   # '$42'
f'{m:usd}'                # '$42'
f'{m:.2f}'                # '42.00'
```

The `!r`, `!s`, and `!a` conversion flags apply `repr()`/`str()`/`repr()` to the
value before formatting, bypassing `__format__` (same as Python).

String predicate methods are also available:

```py
str.isalpha('abc')      # True — all alphabetic
str.isdigit('123')      # True — all digits
str.isalnum('abc123')   # True — alphanumeric
str.isspace('   ')      # True — all whitespace
str.isupper('ABC')      # True
str.islower('abc')      # True
str.isidentifier('my_var')  # True — valid Python identifier
```

Python 3.9 prefix/suffix removal:

```py
str.removeprefix('HelloWorld', 'Hello')  # 'World'
str.removesuffix('HelloWorld', 'World')  # 'Hello'
```

Case-folding for locale-insensitive lowercase comparison:

```py
str.casefold('ÄÖÜ') == str.casefold('äöü')  # True (maps to lowercase)
```

Tab expansion:

```py
str.expandtabs('a\tb', 4)   # 'a   b'  — expand to next 4-space tab stop
str.expandtabs('\t\t', 8)   # '                '  — two full tab stops
str.expandtabs('ab\tc', 4)  # 'ab  c'  — only 2 spaces needed to reach next stop
```

The optional `tabsize` argument defaults to `8`, matching Python's default. A `tabsize` of `0` removes all tab characters. Newline (`\n`) and carriage-return (`\r`) characters reset the column counter, so each line is expanded independently.

However, if you want to make the python string methods available on string
objects, there is a convenience method in the standard library to do so. Use
the following code:

```py
from pythonize import strings
strings()
```

After you call the `strings()` function, all python string methods will be
available on string objects, just as in python. The only caveat is that two
methods: `split()` and `replace()` are left as the native JavaScript versions,
as their behavior is not compatible with that of the python versions. You can
control which methods are not copied to the JavaScript String object by passing
their names to the `strings()` function, like this:

```py
strings('split', 'replace', 'find', ...)
# or
strings(None)  # no methods are excluded
```

One thing to keep in mind is that in JavaScript string are UTF-16, so they
behave like strings in narrow builds of Python 2.x. This means that non-BMP
unicode characters are represented as surrogate pairs. RapydScript includes
some functions to make dealing with non-BMP unicode characters easier:

  - ``str.uchrs(string, [with_positions])`` -- iterate over unicode characters in string, so, for example:

	```py
	list(str.uchrs('s🐱a')) == ['s', "🐱", 'a']
	```

	You can also get positions of individual characters:

	```py
	list(str.uchrs('s🐱a', True)) == [[0, 's'], [1, "🐱"], [3, 'a']]
	```
	Note that any broken surrogate pairs in the underlying string are returned
	as the unicode replacement character U+FFFD

  - ``str.uslice(string, [start, [stop]])`` -- get a slice based on unicode character positions, for example:

	```py
	str.uslice('s🐱a', 2') == 'a'  # even though a is at index 3 in the native string object
	```

  - ``str.ulen(string)`` -- return the number of unicode characters in the string

The Existential Operator
---------------------------

One of the annoying warts of JavaScript is that there are two "null-like"
values: `undefined` and `null`. So if you want to test if a variable is not
null you often have to write a lengthy expression that looks like

```py
(var !== undefined and var !== None)
```

Simply doing `bool(var)` will not work because zero and empty strings are also
False.

Similarly, if you need to access a chain of properties/keys and dont want a
`TypeError` to be raised, if one of them is undefined/null then you have
to do something like:

```py
if a and a.b and a.b.c:
	ans = a.b.c()
else:
	ans = undefined
```

To ease these irritations, RapydScript borrows the *Existential operator* from
CoffeeScript. This can be used to test if a variable is null-like, with a
single character, like this:

```py
yes = True if no? else False
# Which, without the ? operator becomes
yes = True if no is not undefined and no is not None else False
```

When it comes to long chains, the `?` operator will return the expected value
if all parts of the chain are ok, but cause the entire chaning to result in
`undefined` if any of its links are null-like. For example:

```py
ans = a?.b?[1]?()
# Which, without the ? operator becomes
ans = undefined
if a is not undefined and a is not None and a.b is not undefined and a.b is not None and jstype(a.b[1]) is 'function':
	ans = a.b[1]()
```

Finally, you can also use the existential operator as shorthand for the
conditional ternary operator, like this:

```py
a = b ? c
# is the same as
a = c if (b is undefined or b is None) else b
```

Walrus Operator
---------------

RapydScript supports the walrus (assignment expression) operator `:=` from
Python 3.8 (PEP 572). It assigns a value and returns it as an expression,
allowing you to avoid repeating a computation:

```python
# assign and test in a single expression
if m := re.match(r'\d+', line):
    print(m.group())

# drain an iterable in a while loop
while chunk := file.read(8192):
    process(chunk)

# filter and capture in a comprehension
results = [y for x in data if (y := transform(x)) is not None]
```

The walrus operator binds to the nearest enclosing function or module scope
(not the comprehension scope), matching Python semantics.

Ellipsis Literal
-----------------

RapydScript supports the Python `...` (Ellipsis) literal. It compiles to a
frozen singleton object `ρσ_Ellipsis` and is also accessible as `Ellipsis`
(the global name), matching Python behaviour.

Common uses:

```py
# As a placeholder body (like pass)
def stub():
    ...

# As a sentinel / marker value
def process(data, mask=...):
    if mask is ...:
        mask = default_mask()

# In type annotations
from typing import Callable
f: Callable[..., int]

# In numpy-style array indexing
arr[..., 0]   # Ellipsis selects all leading dimensions
```

`str(...)` returns `'Ellipsis'`, and `... is ...` is `True` (singleton
identity). `...` is truthy.

Extended Subscript Syntax
--------------------------

RapydScript supports Python's extended subscript syntax, where **commas
inside `[]` implicitly form a tuple**. This is the same syntax Python uses for
multi-dimensional indexing (e.g. NumPy arrays, custom `__getitem__`
implementations).

```python
# a[i, j] is equivalent to a[(i, j)] in Python
# RapydScript compiles it to a[[i, j]] in JavaScript

# Multi-dimensional dict key
d = {}
d[0, 1] = "origin"
print(d[0, 1])   # → "origin"

# Three or more indices
d[1, 2, 3] = "cube"
print(d[1, 2, 3])  # → "cube"

# Works with variables
row, col = 2, 5
matrix = {}
matrix[row, col] = 42
print(matrix[row, col])  # → 42
```

The tuple is represented as a plain JavaScript array in the generated output:

```python
d[0, 1]   # → d[[0, 1]]
d[x, y]   # → d[[x, y]]
```

This works in both plain subscript access and with `overload_getitem` (where
the tuple is passed as a RapydScript list to `__getitem__`/`__setitem__`).

Variable Type Annotations
--------------------------

RapydScript supports Python's variable type annotation syntax (PEP 526). You
can annotate a variable with a type hint, with or without an initial value:

```python
# Annotated assignment: declares and assigns the variable
x: int = 42
name: str = "Alice"
items: list = [1, 2, 3]
coords: tuple = (10, 20)

# Annotation only: declares the type without assigning a value
count: int
```

Annotations follow the same syntax as Python: the variable name, a colon, the
type expression, and optionally `= value`. The type expression can be any valid
RapydScript expression:

```python
# Complex annotation expressions
data: Optional[str] = None
mapping: dict = {}
result: int = len(items) * 2
```

Annotations work at module scope, inside functions, and inside class bodies:

```python
class Point:
    x: float = 0.0
    y: float = 0.0

    def move(self, dx: float, dy: float) -> None:
        self.x += dx
        self.y += dy

def distance(p: Point) -> float:
    dx: float = p.x
    dy: float = p.y
    return (dx * dx + dy * dy) ** 0.5
```

In the compiled JavaScript, the type annotation is erased — only the
assignment (if present) is emitted. This matches Python's runtime behaviour
where annotations are metadata and do not affect execution. The existing
function parameter annotation support (`:` on parameters, `->` for return
types) is unaffected and continues to emit `__annotations__` metadata on the
function object.

Regular Expressions
----------------------

RapydScript includes a ```re``` module that mimics the interface of the Python
re module. However, it uses the JavaScript regular expression functionality
under the hood, which has several differences from the Python regular
expression engine. Most importantly:

  - it does not support lookbehind and group existence assertions
  - it does not support unicode (on ES 6 runtimes, unicode is supported, but
	with a different syntax). You can test for the presence of unicode support with
	```re.supports_unicode```. 
  - The ``MatchObject``'s ``start()`` and ``end()`` method cannot return correct values
    for subgroups for some kinds of regular expressions, for example, those
	with nested captures. This is because the JavaScript regex API does not expose
	this information, so it has to be guessed via a heuristic.

You can use the JavaScript regex literal syntax, including verbose regex
literals, as shown below. In verbose mode, whitespace is ignored and # comments
are allowed (except inside character classes -- verbose mode works in the same
way as in python, except you use the JavaScript Regex literal syntax).

```py
import re
re.match(/a(b)/, 'ab') == re.match('a(b)', 'ab')

re.match(///
  a  # a comment
  b  # Another comment
  ///, 'ab')
```

JSX Support
-----------

RapydScript supports JSX syntax for building React UI components. JSX elements compile directly to `React.createElement()` calls, so the output is plain JavaScript — no Babel or JSX transform step is needed.

JSX support is **on by default**. The ``jsx`` flag can be disabled with
``from __python__ import no_jsx`` if needed.

### Requirements

`React` must be in scope at runtime. How you provide it depends on your environment:

- **Bundler (Vite, webpack, etc.):** `import React from 'react'` at the top of your file (or configure your bundler's global React shim).
- **CDN / browser script tag:** load React before your compiled script.
- **Bitburner:** React is already available as a global — no import needed.
- **RapydScript web REPL:** a minimal React stub is injected automatically so `React.createElement` calls succeed.

### Output format

RapydScript compiles JSX to `React.createElement()` calls. For example:

```py
def Greeting(props):
    return <h1>Hello, {props.name}!</h1>
```

Compiles to:

```js
function Greeting(props) {
    return React.createElement("h1", null, "Hello, ", props.name);
}
```

Lowercase tags (`div`, `span`, `h1`, …) become string arguments. Capitalised names and dot-notation (`MyComponent`, `Router.Route`) are passed as references — not strings.

### Attributes

String, expression, boolean, and hyphenated attribute names all work:

```py
def Form(props):
    return (
        <form>
            <input
                type="text"
                aria-label="Name"
                disabled={props.readonly}
                onChange={props.onChange}
                required
            />
        </form>
    )
```

Hyphenated names (e.g. `aria-label`, `data-id`) are automatically quoted as object keys: `{"aria-label": "Name"}`. Boolean attributes with no value compile to `true`.

### Nested elements and expressions

```py
def UserList(users):
    return (
        <ul className="user-list">
            {[<li key={u.id}>{u.name}</li> for u in users]}
        </ul>
    )
```

### Fragments

Use `<>...</>` to return multiple elements without a wrapper node. Fragments compile to `React.createElement(React.Fragment, null, ...)`:

```py
def TwoItems():
    return (
        <>
            <span>First</span>
            <span>Second</span>
        </>
    )
```

### Self-closing elements

```py
def Avatar(props):
    return <img src={props.url} alt={props.name} />
```

### Spread attributes

```py
def Button(props):
    return <button {...props}>Click me</button>
```

Compiles to `React.createElement("button", {...props}, "Click me")`.

### Component tags

Capitalised names and dot-notation are treated as component references (not quoted strings):

```py
def App():
    return (
        <Router.Provider>
            <MyComponent name="hello" />
        </Router.Provider>
    )
```

Compiles to:

```js
React.createElement(Router.Provider, null,
    React.createElement(MyComponent, {name: "hello"})
)
```

### Compiling JSX files

Since the output is plain JavaScript, compile to a `.js` file as normal:

```sh
rapydscript mycomponent.pyj --output mycomponent.js
```

React Standard Library
-----------------------

RapydScript ships a `react` standard library module that re-exports every standard React hook and utility under their familiar Python-friendly names.  Import the pieces you need and the compiler will resolve each name to the corresponding `React.*` property at compile time.

### Importing hooks

```py
from react import useState, useEffect, useCallback, useMemo, useRef

def Counter():
    count, setCount = useState(0)

    def increment():
        setCount(count + 1)

    return <button onClick={increment}>{count}</button>
```

Compiles to:

```js
var useState = React.useState;
// ...
function Counter() {
    var [count, setCount] = React.useState(0);
    function increment() {
        setCount(count + 1);
    }
    return React.createElement("button", {onClick: increment}, count);
}
```

Tuple unpacking works naturally because `React.useState` returns a two-element array — `count, setCount = useState(0)` compiles to the ES6 destructuring `var [count, setCount] = React.useState(0)`.

### Available exports

**Hooks (React 16.8+)**

| Import name | React API |
|---|---|
| `useState` | `React.useState` |
| `useEffect` | `React.useEffect` |
| `useContext` | `React.useContext` |
| `useReducer` | `React.useReducer` |
| `useCallback` | `React.useCallback` |
| `useMemo` | `React.useMemo` |
| `useRef` | `React.useRef` |
| `useImperativeHandle` | `React.useImperativeHandle` |
| `useLayoutEffect` | `React.useLayoutEffect` |
| `useDebugValue` | `React.useDebugValue` |

**Hooks (React 18+)**

| Import name | React API |
|---|---|
| `useId` | `React.useId` |
| `useTransition` | `React.useTransition` |
| `useDeferredValue` | `React.useDeferredValue` |
| `useSyncExternalStore` | `React.useSyncExternalStore` |
| `useInsertionEffect` | `React.useInsertionEffect` |

**Core classes and elements**

| Import name | React API |
|---|---|
| `Component` | `React.Component` |
| `PureComponent` | `React.PureComponent` |
| `Fragment` | `React.Fragment` |
| `StrictMode` | `React.StrictMode` |
| `Suspense` | `React.Suspense` |
| `Profiler` | `React.Profiler` |

**Utilities**

| Import name | React API |
|---|---|
| `createElement` | `React.createElement` |
| `cloneElement` | `React.cloneElement` |
| `createContext` | `React.createContext` |
| `createRef` | `React.createRef` |
| `forwardRef` | `React.forwardRef` |
| `isValidElement` | `React.isValidElement` |
| `memo` | `React.memo` |
| `lazy` | `React.lazy` |

### Common patterns

**useEffect with cleanup**

```py
from react import useState, useEffect

def Timer():
    count, setCount = useState(0)
    def setup():
        interval = setInterval(def(): setCount(count + 1);, 1000)
        def cleanup():
            clearInterval(interval)
        return cleanup
    useEffect(setup, [count])
    return count
```

**useReducer**

```py
from react import useReducer

def reducer(state, action):
    if action.type == 'increment':
        return state + 1
    if action.type == 'decrement':
        return state - 1
    return state

def Counter():
    state, dispatch = useReducer(reducer, 0)
    def inc():
        dispatch({'type': 'increment'})
    return state
```

**useContext**

```py
from react import createContext, useContext

ThemeContext = createContext('light')

def ThemedButton():
    theme = useContext(ThemeContext)
    return theme
```

**useRef**

```py
from react import useRef

def FocusInput():
    inputRef = useRef(None)
    def handleClick():
        inputRef.current.focus()
    return <input ref={inputRef} />
```

**memo**

```py
from react import memo

def Row(props):
    return <li>{props.label}</li>

MemoRow = memo(Row)
```

**forwardRef**

```py
from react import forwardRef

def FancyInput(props, ref):
    return <input ref={ref} placeholder={props.placeholder} />

FancyInputWithRef = forwardRef(FancyInput)
```

**Class component**

You can extend `React.Component` directly without importing it, or import `Component` from the `react` module:

```py
from react import Component

class Greeter(Component):
    def render(self):
        return <h1>Hello, {self.props.name}!</h1>
```

**useTransition (React 18)**

```py
from react import useState, useTransition

def SearchInput():
    isPending, startTransition = useTransition()
    query, setQuery = useState('')
    def handleChange(e):
        startTransition(def(): setQuery(e.target.value);)
    return isPending
```

### Requirements

The `react` module does not bundle React itself — it provides compile-time name bindings only.  `React` must be available as a global variable at runtime, exactly as described in the [JSX Requirements](#requirements) section above.

Creating DOM trees easily
---------------------------------

RapydScript includes a small module in its standard library to create DOM tress
efficiently. It leverages the powerful support for python style function
calling. Best illustrated with an example:

```py
from elementmaker import E

E.div(id="container", class_="xxx",
	E.div('The Heading', data_heading="1"),
	E.p('Some text ',
		E.i('with italics'),
		E('custom', ' and a csutom tag'),
	)
)
```

This is equivalent to:

```html
<div id="container" class="xxx">
	<div data-heading="1">The Heading</div>
	<p>Some text <i>with italics</i><custom> and a custom tag</custom></p>
</div>
```

Basically, you create text nodes and children as positional arguments and
attributes as keyword arguments. Note that if an attribute name is a reserved
keyword in RapydScript, you can postfix it with an underscore. So ```class_```
becomes ```class```. Also, underscores are automatically replaced by hyphens,
so ```data-*``` attributes can be created. Finally, if you need a non-standard
tag, you simply use the ```E()``` function by itself with the first argument
being the tag name.

Another great feature is that you can pass functions as event handlers
directly, so for example:

```py
E.a(onclick=def():
	pass  # do something on the click event
)
```

Classes
-------
JavaScript is not known for having excellent class implementation - but RapydScript improves on that. Imagine we want a special text field that takes in a user color string and changes color based on it. Let's create such field via a class:

```js
class ColorfulTextField:
	def __init__(self):
		field = $('<input></input>')
		changeColor = def(event):
			field.css('backround', field.val())
		field.keydown(changeColor)
		self.widget = field
```

This class abuses DOM's tolerant behavior, where it will default to the original setting when the passed-in color is invalid (saving us the extra error-checking logic). To append this field to our page we can run the following code:

```py
textfield = ColorfulTextField()
$('body').append(textfield.widget)
```

If you're used to JavaScript, the code above probably set off a few red flags in your head. In pure JavaScript, you can't create an object without using a 'new' operator. Don't worry, the above code will compile to the following:

```js
var textfield;
textfield = new ColorfulTextField()
$('body').append(textfield.widget);
```

RapydScript will automatically handle appending the 'new' keyword for you, assuming you used 'class' to create the class for your object. This also holds when creating an object inside a list or returning it as well. You could easily do the following, for example:

```
fields = [ColorfulTextField(), ColorfulTextField(), ColorfulTextField()]
```

This is very useful for avoiding a common JavaScript error of creating 'undefined' objects by forgetting this keyword. One other point to note here is that regular DOM/JavaScript objects are also covered by this. So if you want to create a DOM image element, you should not use the 'new' keyword either:

```py
myImage = Image()
```

But RapydScript's capability doesn't end here. Like Python, RapydScript allows inheritance. Let's say, for example, we want a new field, which works similar to the one above. But in addition to changing color of the field, it allows us to change the color of a different item, with ID of 'target' after we press the 'apply' button, located right next to it. Not a problem, let's implement this guy:

```js

class TextFieldAffectingOthers(ColorfulTextField):
	def __init__(self):
		ColorfulTextField.__init__(self)
		field = self.widget
		submit = $('<button type="button">apply</button>')
		applyColor = def(event):
			$('#target').css('background', field.val())
		submit.click(applyColor)
		self.widget = $('<div></div>')\
			.append(field)\
			.append(submit)
```

A couple of things to note here. We can invoke methods from the parent class
the same way we would in Python, by using `Parent.method(self, ...)` syntax.
This allows us to control when and how (assuming it requires additional
arguments) the parent method gets executed. Also note the use of `\` operator
to break up a line. This is something Python allows for keeping each line short
and legible. Likewise, RapydScript, being indentation-based, allows the same.

RapydScript also supports Python 3's `super()` built-in for calling parent
class methods without naming the parent explicitly:

```py
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return self.name + ' says something'

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)   # calls Animal.__init__
        self.breed = breed

    def speak(self):
        return super().speak() + ' (woof!)'
```

Both the zero-argument form `super()` (Python 3 style) and the two-argument
form `super(ClassName, self)` (Python 2 style) are supported. The call
`super().method(args)` compiles to `ParentClass.prototype.method.call(this,
args)` in JavaScript. The Monaco language service also recognises `super` for
completions, hover documentation, and diagnostics.

Like Python, RapydScript allows multiple inheritance. The only caveat is that 
the internal semantics of how it works are pretty different from python, since
it is built on JavaScript's prototypical inheritance. For the most part you
wont notice any differences from python, except, if you have a very complex
inheritance hierarchy, especially, one with cycles. In this (rare) case you may
find that the method-resolution-order in RapydScript is different from Python.

Like Python, RapydScript allows static methods. Marking the method static with
`@staticmethod` decorator will compile that method such that it's not bound to
the object instance, and ensure all calls to this method compile into static
method calls:

```py
class Test:
	def normalMethod(self):
		return 1

	@staticmethod
	def staticMethod(a):
		return a+1
```

### Class Identity Properties

Every RapydScript class automatically gets the following Python-compatible identity properties:

| Property | Value | Notes |
|----------|-------|-------|
| `MyClass.__name__` | `"MyClass"` | The class name as a string |
| `MyClass.__qualname__` | `"MyClass"` | Qualified name (same as `__name__` for top-level classes) |
| `MyClass.__module__` | module ID string | Module where the class is defined |
| `instance.__class__` | `MyClass` | The class of the instance (same as `type(instance)`) |

```py
class Animal:
	def __init__(self, name):
		self.name = name

print(Animal.__name__)      # "Animal"
print(Animal.__qualname__)  # "Animal"

a = Animal("Rex")
print(a.__class__ is Animal)       # True
print(type(a).__name__)            # "Animal"
```

This makes patterns like `type(obj).__name__` and `obj.__class__` work identically to Python.

### Class Methods

RapydScript supports the `@classmethod` decorator, which works just like Python's `classmethod`. The first argument (conventionally named `cls`) receives the class itself rather than an instance. Class methods can be called on the class directly or on an instance (which delegates to the class with the correct type):

```py
class Shape:
	def __init__(self, kind, size):
		self.kind = kind
		self.size = size

	@classmethod
	def circle(cls, size):
		return cls('circle', size)

	@classmethod
	def square(cls, size):
		return cls('square', size)

s1 = Shape.circle(10)   # s1.kind == 'circle', s1.size == 10
s2 = Shape.square(5)    # s2.kind == 'square', s2.size == 5

# Can also be called on an instance (delegates to the class)
s3 = s1.circle(7)       # equivalent to Shape.circle(7)
```

Class variables declared in the class body are accessible via `cls.varname` inside a classmethod, just as in Python:

```py
class Counter:
	count = 0

	@classmethod
	def increment(cls):
		cls.count += 1

	@classmethod
	def get_count(cls):
		return cls.count

Counter.increment()
Counter.increment()
print(Counter.get_count())  # 2
```

The `@classmethod` decorator compiles to a method placed directly on the class (not its prototype), with `cls` mapped to `this`. A prototype delegation shim is also generated so instance calls work correctly.

### `__new__` Constructor Hook

RapydScript supports Python's `__new__` method, which runs *before* `__init__` and controls instance creation. Use it to implement patterns like singletons or alternative constructors:

```py
class Singleton:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    def __init__(self):
        pass

a = Singleton()
b = Singleton()
assert a is b  # same instance
```

`super().__new__(cls)` creates a bare instance of `cls` (equivalent to `Object.create(cls.prototype)` in JavaScript). If `__new__` returns an instance of the class, `__init__` is called on it automatically. If it returns something else, `__init__` is skipped.

Class variables accessed via `cls` inside `__new__` are correctly rewritten to `cls.prototype.varname`, matching Python's semantics.

### `__class_getitem__`

RapydScript supports Python's `__class_getitem__` hook, which enables subscript syntax on a class itself (`MyClass[item]`).  Define `__class_getitem__(cls, item)` in a class body to intercept `ClassName[x]`:

```py
class Box:
    def __class_getitem__(cls, item):
        return cls.__name__ + '[' + str(item) + ']'

print(Box[int])   # Box[<class 'int'>]
print(Box['str']) # Box[str]
```

`__class_getitem__` is an implicit `@classmethod`: the compiler strips `cls` from the JS parameter list and maps it to `this`, so calling `Box[item]` compiles to `Box.__class_getitem__(item)` with `this = Box`.

Subclasses inherit `__class_getitem__` from their parent and receive the subclass as `cls`:

```py
class Base:
    def __class_getitem__(cls, item):
        return cls.__name__ + '<' + str(item) + '>'

class Child(Base):
    pass

print(Base[42])   # Base<42>
print(Child[42])  # Child<42>
```

Class variables declared in the class body are accessible via `cls.varname` inside `__class_getitem__`, just as with `@classmethod`.

### `__init_subclass__`

`__init_subclass__` is a hook that is called automatically on a base class whenever a subclass is created.  It is an implicit `@classmethod`: the compiler strips `cls` from the JS signature and maps it to `this`, so `cls` receives the newly-created subclass.

```py
class PluginBase:
    _plugins = []

    def __init_subclass__(cls, **kwargs):
        PluginBase._plugins.append(cls)

class AudioPlugin(PluginBase):
    pass

class VideoPlugin(PluginBase):
    pass

print(len(PluginBase._plugins))     # 2
print(PluginBase._plugins[0].__name__)  # AudioPlugin
```

Keyword arguments written in the class header are forwarded to `__init_subclass__`:

```py
class Base:
    def __init_subclass__(cls, required=False, **kwargs):
        cls._required = required

class Strict(Base, required=True):
    pass

class Loose(Base):
    pass

print(Strict._required)   # True
print(Loose._required)    # False
```

Use `super().__init_subclass__(**kwargs)` to propagate the hook up the hierarchy:

```py
class GrandParent:
    def __init_subclass__(cls, **kwargs):
        cls._from_grandparent = True

class Parent(GrandParent):
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)   # propagates to GrandParent

class Child(Parent):
    pass

print(Child._from_grandparent)   # True
```

The hook is called after the subclass is fully set up (including `__name__`, `__qualname__`, and `__module__`), so `cls.__name__` is always the correct subclass name inside the hook.

### Nested Classes

A class may be defined inside another class. The nested class becomes an attribute of the outer class (accessible as `Outer.Inner`) and is also reachable via instances (`self.Inner` inside methods). This mirrors Python semantics exactly.

```py
class Molecule:
    class Atom:
        def __init__(self, element):
            self.element = element
        def __repr__(self):
            return 'Atom(' + self.element + ')'

    def __init__(self, elements):
        self.structure = []
        for e in elements:
            self.structure.push(Molecule.Atom(e))

water = Molecule(['H', 'H', 'O'])
print(len(water.structure))          # 3
print(water.structure[0].element)    # H
print(isinstance(water.structure[0], Molecule.Atom))  # True
```

The nested class is a full class in every respect — it can have its own methods, inherit from other classes, and contain further nested classes:

```py
class Universe:
    class Galaxy:
        class Star:
            def __init__(self, name):
                self.name = name
        def __init__(self, star_name):
            self.star = Universe.Galaxy.Star(star_name)
    def __init__(self, star_name):
        self.galaxy = Universe.Galaxy(star_name)

u = Universe('Sol')
print(u.galaxy.star.name)                    # Sol
print(isinstance(u.galaxy.star, Universe.Galaxy.Star))  # True
```

A nested class may also inherit from classes defined in the outer scope:

```py
class Animal:
    def __init__(self, sound):
        self.sound = sound

class Zoo:
    class Dog(Animal):
        def __init__(self):
            Animal.__init__(self, 'woof')

fido = Zoo.Dog()
print(fido.sound)             # woof
print(isinstance(fido, Animal))    # True
print(isinstance(fido, Zoo.Dog))   # True
```

### External Classes

RapydScript will automatically detect classes declared within the same scope (as long as the declaration occurs before use), as well as classes properly imported into the module (each module making use of a certain class should explicitly import the module containing that class). RapydScript will also properly detect native JavaScript classes (String, Array, Date, etc.). Unfortunately, RapydScript has no way of detecting classes from third-party libraries. In those cases, you could use the `new` keyword every time you create an object from such class. Alternatively, you could mark the class as external.

Marking a class as external is done via `external` decorator. You do not need to fill in the contents of the class, a simple `pass` statement will do:

```py
@external
class Alpha:
	pass
```

RapydScript will now treat `Alpha` as if it was declared within the same scope, auto-prepending the `new` keyword when needed and using `prototype` to access its methods (see `casperjs` example in next section to see how this can be used in practice). You don't need to pre-declare the methods of this class (unless you decide to for personal reference, the compiler will simply ignore them) unless you want to mark certain methods as static:

```py
@external
class Alpha:
	@staticmethod
	def one():
		pass
```

`Alpha.one` is now a static method, every other method invoked on `Alpha` will still be treated as a regular class method. While not mandatory, you could pre-declare other methods you plan to use from `Alpha` class as well, to make your code easier to read for other developers, in which case this `external` declaration would also serve as a table of contents for `Alpha`:

```py
@external
class Alpha:
	def two(): pass
	def three(): pass

	@staticmethod
	def one(): pass
```

As mentioned earlier, this is simply for making your code easier to read. The compiler itself will ignore all method declarations except ones marked with `staticmethod` decorator.

You could also use `external` decorator to bypass improperly imported RapydScript modules. However, if you actually have control of these modules, the better solution would be to fix those imports.


### Method Binding

RapydScript automatically binds methods to their objects by default (the
``bound_methods`` flag is **on by default**). This means method references
like ``getattr(obj, 'method')`` work correctly when called later.

If you need to disable auto-binding in a scope, use
``from __python__ import no_bound_methods``.

For example:

```py
class C:
    def __init__(self):
        self.a = 3

    def val(self):
        return self.a

getattr(C(), 'val')() == 3  # works because bound_methods is on by default
```

You can mix bound and unbound methods within a class using ``no_bound_methods``
and ``bound_methods`` to toggle at any point:

```py
class C:

	def bound1(self):
		pass # auto-bound (default)

	from __python__ import no_bound_methods
	# Methods below this line will not be auto-bound

	def unbound(self):
		pass  # not auto-bound

	from __python__ import bound_methods
	# Methods below this line will be auto-bound again

	def bound2(self):
	   pass # auto-bound
```

Scoped flags apply only to the scope they are defined in, so if you define them
inside a class declaration, they only apply to that class. If you define it at
the module level, it will apply to all classes in the module that occur
below that line, and so on.

Iterators
----------

RapydScript supports iterators, just like python, with a few differences to
make interoperating with other JavaScript code nicer. You can make an iterator
from an array or object by simply calling the builtin ``iter()`` function, just
as you would in python. The result of the function is a javascript iterator
object, that works both in RapydScript's for..in loops and ES6 JavaScript
for..of loops. Indeed they will work with any vanilla JavaScript code that
expects an iterable object. You can make your own classes iterable by defining
an ``__iter__`` method, just as you would in python. For example:

```python
	class A:

		def __init__(self):
			self.items = [1, 2, 3]

		def __iter__(self):
			return iter(self.items)

	for x in A():
	   print (x)  # Will print 1, 2, 3
```

Internally, an iterator's ``.next()`` method returns a JavaScript object with
two properties: ``done`` and ``value``. ``value`` is the next value and
``done`` is ``True`` when the iterator is exhausted. This matches the
JavaScript iterator protocol and allows interoperability with vanilla JS code.

RapydScript also provides the Python-style ``next()`` builtin, which wraps
this protocol transparently:

```python
it = iter([1, 2, 3])
next(it)         # 1
next(it)         # 2
next(it, 'end')  # 3
next(it, 'end')  # 'end'  (iterator exhausted, default returned)
next(it)         # raises StopIteration
```

When the iterator is exhausted and no default is given, ``StopIteration``
is raised — matching standard Python behaviour.

The two-argument form ``iter(callable, sentinel)`` repeatedly calls
``callable`` (with no arguments) and yields each return value until it equals
``sentinel``, at which point the iterator stops:

```python
count = [0]
def next_val():
    count[0] += 1
    return count[0]

list(iter(next_val, 4))   # [1, 2, 3]

for val in iter(next_val, 7):
    print(val)            # 5, 6
```

The callable may be any function or object with a ``__call__`` method.
Sentinel comparison uses strict equality (``===``), matching Python's
``is``-then-``==`` semantics for the common case of plain values.

Generators
------------

RapydScript supports generators (the python yield keyword). For example:

```py
def f():
	for i in range(3):
		yield i

[x for x in f()] == [0, 1, 2]
```

There is full support for generators including the Python 3, ```yield from```
syntax.

Generators create JavaScript iterator objects. For differences between python
and JavaScript iterators, see the section on iterators above.

By default, generators are down-converted to ES 5 switch statements. Pass
``--js-version 6`` to the compiler (or set ``js_version: 6`` in the embedded
compiler options) to emit native ES 6 generator functions instead, which are
smaller and faster.

Modules
-------

RapydScript's module system works almost exactly like Python's. Modules are
files ending with the suffix ```.pyj``` and packages are directories containing
an ```__init__.pyj``` file. The only caveat is that star imports are not
currently supported (this is by design, star imports are easily abused).
You can import things from modules, just like you would in python:

```py
from mypackage.mymodule import something, something_else
```

When you import modules, the RapydScript compiler automatically generates a
single large JavaScript file containing all the imported packages/modules and
their dependencies, recursively. This makes it very easy to integrate the
output of RapydScript into your website.

Modules are searched for by default in the rapydscript builtin modules
directory and the directory of the rapydscript file that you are
compiling. You can add additional directories to the searched locations via
the RAPYDSCRIPT_IMPORT_PATH environment variable or the --import-path option 
to the RapydScript compiler. See the documentation of the option for details.

Structural Pattern Matching
---------------------------

RapydScript supports Python's `match/case` statement (PEP 634). The syntax is
identical to Python's and transpiles to efficient JavaScript using a labeled
`do { … } while (false)` block.

`match` and `case` are **soft keywords** — they remain valid variable names
when not used as a statement head, so existing code is unaffected.

**Literal patterns**

```python
match command:
    case "quit":
        quit()
    case "go north":
        go_north()
    case _:
        print("unknown command")
```

**Capture patterns**

```python
match value:
    case x:
        print(x)   # x is bound to value
```

**OR patterns**

```python
match status:
    case 200 | 201 | 202:
        print("success")
    case 404:
        print("not found")
```

**Guards**

```python
match point:
    case [x, y] if x == y:
        print("on diagonal")
    case [x, y]:
        print("off diagonal")
```

**Sequence patterns**

```python
match items:
    case []:
        print("empty")
    case [head, *tail]:
        print(head, tail)
    case [a, b]:
        print(a, b)
```

**Mapping patterns**

```python
match data:
    case {"action": "move", "x": x, "y": y}:
        move(x, y)
    case {"action": "quit"}:
        quit()
```

**Class patterns**

```python
class Point:
    __match_args__ = ["x", "y"]
    def __init__(self, x, y):
        self.x, self.y = x, y

match shape:
    case Point(x=0, y=0):
        print("origin")
    case Point(x=px, y=py):
        print(px, py)
```

**AS patterns**

```python
match val:
    case [x, y] as point:
        print(point, x, y)
```

Exception Handling
------------------

Exception handling in RapydScript works just like it does in python.

An example:

```py
try:
	somefunc()
except Exception as e:
	import traceback
	traceback.print_exc()
else:
    print('no exception occurred')
finally:
    cleanup()
```

You can create your own Exception classes by inheriting from `Exception`, which
is the JavaScript Error class, for more details on this, see the [MDN documentation](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Error).

```py
class MyError(Exception):
	def __init__(self, message):
		self.name = 'MyError'
		self.message = message

raise MyError('This is a custom error!')
```

You can catch multiple exception types in one `except` clause. Both the comma form and the tuple form are supported:

```py
try:
	print(foo)
except ReferenceError, TypeError as e:
	print(e.name + ':' + e.message)
	raise # re-raise the exception

# Equivalent tuple form (Python 3 style):
try:
    risky()
except (ReferenceError, TypeError) as e:
    handle(e)
```

Exception chaining with `raise X from Y` is supported. The cause is stored on the raised exception's `__cause__` attribute:

```py
try:
    open_file('data.txt')
except OSError as exc:
    raise ValueError('Could not read config') from exc
```

Use `raise X from None` to explicitly suppress the chained context:

```py
except SomeInternalError:
    raise PublicError('something went wrong') from None
```

Basically, `try/except/finally` in RapydScript works very similar to the way it does in Python 3.

### Exception Groups (`except*`, Python 3.11+)

RapydScript supports exception groups via the `ExceptionGroup` class and `except*` syntax. An `ExceptionGroup` bundles multiple exceptions under a single message:

```py
eg = ExceptionGroup("network errors", [
    TimeoutError("host A timed out"),
    TimeoutError("host B timed out"),
    ValueError("bad address"),
])
raise eg
```

Use `except*` to handle exceptions by type — each handler receives a sub-group containing only the matching exceptions:

```py
try:
    fetch_all()
except* TimeoutError as group:
    for e in group.exceptions:
        print("timeout:", e)
except* ValueError as group:
    print("bad input:", group.exceptions[0])
```

- Each `except*` clause sees the exceptions not already matched by earlier clauses.
- Any unmatched exceptions are automatically re-raised as a new `ExceptionGroup`.
- A bare `except*:` (no type) catches all remaining exceptions.
- You cannot mix `except` and `except*` in the same `try` block.
- Plain (non-group) exceptions can also be caught with `except*`; the variable is bound to the exception itself rather than a sub-group.

`ExceptionGroup` also provides `subgroup(condition)` and `split(condition)` for programmatic filtering, where `condition` is either an exception class or a predicate function:

```py
eg = ExceptionGroup("mixed", [ValueError("v"), TypeError("t")])
ve_group = eg.subgroup(ValueError)          # ExceptionGroup of just ValueErrors
matched, rest = eg.split(ValueError)        # (ve_group, te_group)
```

Scope Control
-------------

Scope refers to the context of a variable. For example, a variable declared inside a function is not seen by the code outside the function. This variable's scope is local to the function. JavaScript controls scope via `var` keyword. Any variable that you start using without declaring with a `var` first will try to reference inner-most variable with the same name, if one doesn't exist, it will create a global variable with that name. For example, the following JavaScript code will not only return `a` incremented by 1, but also overwrite the global variable `a` with `a+1`:

```py
a = 1;
a_plus_1 = function() {
	return ++a;
};
```

Basically, JavaScript defaults to outer or global scope if you omit `var`. This behavior can introduce some very frustrating bugs in large applications. To avoid this problem, RapydScript's scope preference works in reverse (same as Python's). RapydScript will prefer local-most scope, always creating a local variable if you perform any sort of assignment on it in a function (this is called variable shadowing). Shadowing can create another annoyance, however, of function's variable changes getting discarded. For example, at first, it looks like the following code will set `a` to 2:

```py
a = 1
b = 1
increment = def():
	a += b
increment()
```

When executed, however, increment() function will discard any changes to `a`. This is because, like Python, RapydScript will not allow you to edit variables declared in outer scope. As soon as you use any sort of assignment with `a` in the inner scope, RapydScript will declare it as an internal variable, shadowing `a` in the outer scope. One way around this is to use the `global` keyword, declaring `a` as a global variable. This, however, must be done in every function that edits `a`. It also litters global scope, which it frowned upon because it can accidentally overwrite an unrelated variable with the same name (declared by someone else or another library). RapydScript solves this by introducing `nonlocal` keyword (just like Python 3):

```py
a = 1
b = 1
increment = def():
	nonlocal a
	a += b
increment()
```

Note that `b` is not affected by shadowing. It's the assignment operator that triggers shadowing, you can read outer-scope variables without having to use `nonlocal`. You can combine multiple non-local arguments by separating them with a comma: `nonlocal a, b, c`. You can also chain `nonlocal` declarations to escape multiple scopes:

```py
def fun1():
	a = 5
	b = fun2():
		nonlocal a
		a *= 2
		c = fun3():
			nonlocal a
			a += 1
```

Shadowing is preferred in most cases, since it can't accidentally damage outside logic, and if you want to edit an external variable, you're usually better off assigning function's return value to it. There are cases, however, when using `nonlocal` makes the code cleaner. For compatibility with Python code, RapydScript also supports the `global` keyword, with the exception that if a variable is present both in the outer scope and the global scope, the variable from the outer scope will be used, rather than the variable from the global scope. This situation is rare in practice, and implementing it in RapydScript would require significant work, so RapydScript `global` remains a little incompatible with Python `global`.


Available Libraries
-------------------

One of Python's main strengths is the number of libraries available to the developer. The large number of readily-available JavaScript libraries will always outnumber community-made Rapydscript libraries. This is why RapydScript was designed with JS and DOM integration in mind from the beginning. For example, plugging in `lodash` in place of RapydScript's `stdlib` will work fine!

 RapydScript's main strength is easy integration with JavaScript and DOM, and easy use of libraries that are already available. That doesn't mean, however, that pythonic libraries can't be written for RapydScript. Rapydscript comes with lightweight clones of several popular Python libraries, which you can find them in `src` directory.

	math                # replicates almost all of the functionality from Python's math library
	re                  # replicates almost all of the functionality from Python's re library
	random              # replicates most of the functionality from Python's random library
	numpy               # NumPy-compatible array library (ndarray, ufuncs, numpy.random, numpy.linalg)
	elementmaker        # easily construct DOM trees
	aes                 # Implement AES symmetric encryption
	encodings           # Convert to/from UTF-8 bytearrays, base64 strings and native strings
	gettext             # Support for internationalization of your RapydScript app
	operator            # a subset of Python's operator module
	functools           # reduce, partial, wraps, lru_cache, cache, total_ordering, cmp_to_key
	enum                # Enum base class — class Color(Enum): RED=1 with .name/.value, iteration
	dataclasses         # @dataclass decorator — auto-generates __init__, __repr__, __eq__; field(),
	                    # fields(), asdict(), astuple(), replace(), is_dataclass(), frozen=True, order=True
	collections         # namedtuple, deque, Counter, OrderedDict, defaultdict
	copy                # copy (shallow), deepcopy; honours __copy__ / __deepcopy__ hooks
	typing              # TYPE_CHECKING, Any, Union, Optional, List, Dict, Set, Tuple, TypeVar,
	                    # Generic, Protocol, Callable, Literal, Final, TypedDict, NamedTuple,
	                    # ByteString, AnyStr (str | bytes), cast, …
	itertools           # count, cycle, repeat, accumulate, chain, compress, dropwhile, filterfalse,
	                    # groupby, islice, pairwise, starmap, takewhile, zip_longest,
	                    # product, permutations, combinations, combinations_with_replacement

For the most part, the logic implemented in these libraries functions identically to the Python versions. I'd be happy to include more libraries, if other members of the community want them. However, unlike most other Python-to-JavaScript compilers, RapydScript doesn't need them to be complete since there are already tons of available JavaScript libraries that it can use natively.

Linter
---------

The RapydScript compiler includes its own, built-in linter. The linter is
modeled on pyflakes, it catches instances of unused/undefined variables,
functions, symbols, etc. While this sounds simple, it is surprisingly effective
in practice. To run the linter:

	rapydscript lint file.pyj

It will catch many errors, for example,

```py
def f():
	somevar = 1
	return someva
```

The linter will catch the typo above, saving you from having to discover it at
runtime. Another example:

```py
def f(somevar1):
	somevar2 = somevar1 * 2
	return somevar1
```

Here, you probably meant to return ``somevar2`` not ``somevar1``. The linter
will detect that somevar2 is defined but not used and warn you about it.

The linter is highly configurable, you can add to the list of built-in names
that the linter will not raise undefined errors for. You can turn off
individual checks that you do not find useful. See ``rapydscript lint -h`` for
details.

Making RapydScript even more pythonic
---------------------------------------

RapydScript has three main goals: To be as fast as possible, to be as close to
python as possible, to interoperate with external javascript libraries.
Sometimes these goals conflict and RapydScript chooses to be less pythonic in
service to the other two goals. Fortunately, there are many optional flags you
can use to reverse these compromises. The most important of these are called
*scoped flags*. 

The scoped flags are local to each scope, that means that if you use it in a
module, it will only affect code in that module, it you use it in a function,
it will only affect code in that function. In fact, you can even use it to
surround a few lines of code. There are many scoped flags, described else where
in this document, see the sections on Method Auto-binding and the section on Dicts
in this document.

Another common complaint is that in RapydScript strings dont have all the
string methods that python strings do. Fortunately, there is solution for that
as well, described in the section on strings in this document.


Advanced Usage Topics
---------------------

#### Browser Compatibility

RapydScript compiles your code such that it will work on browsers that are
compatible with the ES 5 JavaScript standard. The compiler has a 
``--js-version`` option that can also be used to output ES 6 only code. This
code is smaller and faster than the ES 5 version, but is not as widely
compatible.

#### Tabs vs Spaces

This seems to be a very old debate. Python code conventions suggest 4-space
indent. The old version of RapydScript relied on tabs, new one uses spaces
since that seems to be more consistent in both Python and JavaScript
communities. Use whichever one you prefer, as long as you stay consistent. If
you intend to submit your code to RapydScript, it must use spaces to be
consistent with the rest of the code in the repository.

#### External Libraries and Classes

RapydScript will pick up any classes you declare yourself as well as native
JavaScript classes. It will not, however, pick up class-like objects created by
outside frameworks. There are two approaches for dealing with those. One is via
`@external` decorator, the other is via `new` operator when declaring such
object. The `@external` decorator is recommended over the `new` operator for 
several reasons, even if it may be more verbose:

- `@external` decorator makes classes declared externally obvious to anyone looking at your code
- class declaration that uses `@external` decorator can be exported into a reusable module
- developers are much more likely to forget a single instance of `new` operator when declaring an object than to forget an import. the errors due to omitted `new` keyword are also likely to be more subtle and devious to debug

#### Embedding the RapydScript compiler in your webpage

You can embed the RapydScript compiler in your webpage so that you can have
your webapp directly compile user supplied RapydScript code into JavaScript.
To do so, simply include the [embeddable rapydscript compiler](https://github.com/ficocelliguy/rapydscript-ns/blob/master/web-repl/rapydscript.js) 
in your page, and use it to compile arbitrary RapydScript code. 

You create the compiler by calling: `RapydScript.create_embedded_compiler()` and compile
code with `compiler.compile(code)`. You can execute the resulting JavaScript
using the standard `eval()` function. See the sample
HTML below for an example.

```html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>Test embedded RapydScript</title>
        <script charset="UTF-8" src="rapydscript.js"></script>
        <script>
var compiler = RapydScript.create_embedded_compiler();
var js = compiler.compile("def hello_world():\n a='RapydScript is cool!'\n print(a)\n alert(a)");
window.onload = function() {
    document.body.textContent = js;
    eval(js);
    eval('hello_world()');
};
        </script>
    </head>
    <body style="white-space:pre-wrap"></body>
</html>
```

There are a couple of caveats when using the embedded compiler:

* It only works when run in a modern browser (one that supports ES6) so no
  Internet Explorer. You can have it work in an ES 5 runtime by passing
  an option to the compile() method, like this:
  ```
  compiler.compile(code, {js_version:5})
  ```
  Note that doing this means that you cannot use generators and the
  yield keyword in your RapydScript code.

* Importing of modules only works with the standard library modules. There is
  currently no way to make your own modules importable.

* To generate the embedded compiler yourself (rapydscript.js) from a source
  checkout of rapydscript, follow the instructions above for installing from
  source, then run `bin/web-repl-export /path/to/export/directory`

Internationalization
-------------------------

RapydScript includes support for internationalization -- i.e. the translation
of user interface strings defined in the RapydScript source code. The interface
for this is very similar to Python's gettext module.  Suppose you have some
code that needs internalization support, the first step is to mark all
user-viewable strings as translatable:

```py
from gettext import gettext as _
create_button(_('My Button'))
create_button(_('Another Button'))
```

Now we need to extract these string from the source code into a .pot file which
can be used to create translations. To do that, run:

```
rapydscript gettext file.pyj > messages.pot
```

Now send the `messages.pot` file to your translators. Suppose you get back a
`de.po` file from the translators with German translations. You now need to
compile this into a format that can be used by RapydScript (RapydScript uses a
JSON based format for easy operation over HTTP). Simply run:

```
rapydscript msgfmt < messages.pot > messages.json
```

Now, suppose you load up the translation data in your application. Exactly how
you do that is upto you. You can load it via Ajax or using a `<script>` tag. To
activate the loaded data, simply run:

```py
from gettext import install

install(translation_data)
```

Now everywhere in your program that you have calls to the `_()` function, you
will get translated output. So make sure you install the translation data
before building the rest of your user-interface.

Just as in python, you also have a `ngettext()` function for translating
strings that depend on a count.


Gotchas
---------

RapydScript has a couple of mutually conflicting goals: Be as close to python
as possible, while also generating clean, performant JavaScript and making
interop with external JavaScript libraries easy.

As a result, there are some things in RapydScript that might come as surprises
to an experienced Python developer. The most important such gotchas are listed
below:

- RapydScript uses Python truthiness semantics by default: empty lists and dicts
  are falsy and ``__bool__`` is dispatched. This is controlled by the
  ``truthiness`` flag, which is on by default. Use
  ``from __python__ import no_truthiness`` to fall back to JavaScript truthiness
  in a scope.

- Operator overloading is enabled by default via the ``overload_operators``
  flag, so ``[1] + [1]`` produces a new list and ``'ha' * 3`` produces
  ``'hahaha'`` as in Python. If you are working with plain numbers, strings,
  and booleans there is no performance penalty — the dispatch only kicks in
  when a dunder method is defined. Use ``from __python__ import no_overload_operators``
  to disable it in a scope.

- There are many more keywords than in Python. Because RapydScript compiles
  down to JavaScript, the set of keywords is all the keywords of Python + all
  the keywords of JavaScript. For example, ``default`` and ``switch`` are
  keywords in RapydScript. See [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#Keywords)
  for a list of JavaScript keywords.

- Method binding in RS is not automatic. So ``someobj.somemethod()`` will do the
  right thing, but ``x = someobj.somethod; x()`` will not. You can turn method binding on
  via a scoped flag. See the section above on method binding for details.

- RapydScript automatically appends 'new' keyword when using classes generated
  by it, native JavaScript objects like `Image` and `RegExp` and classes from
  other libraries marked as external. However, automatic new insertion depends
  on the compiler being able to detect that a symbol resolves to a class.
  Because of the dynamic nature of JavaScript this is not possible to do with
  100% accuracy. So it is best to get in the habit of using the `new` keyword
  yourself. Similarly, the compiler will try to convert SomeClass.method() into
  SomeClass.prototype.method() for you, but again, this is not 100% reliable.

- The ``{"a":b}`` syntax creates Python ``dict`` objects by default (the
  ``dict_literals`` flag is on by default). Use
  ``from __python__ import no_dict_literals`` to get plain JavaScript objects
  in a scope. See the section on dictionaries above for details.


Python Flags
------------

Python flags are scoped compiler directives that control Python semantics.
All flags are **on by default**.  They can be turned off in a scope with
the ``no_`` prefix.  In source code they are written as:

```py
from __python__ import flag_name
```

At the top level they take effect for the rest of the file; inside a function
or class body they apply only to that scope.  Prefix a flag with `no_` to turn
it off in a scope (e.g. `from __python__ import no_truthiness`).

All flags are **on by default**.  To revert to legacy RapydScript behavior
with no flags enabled, pass ``--legacy-rapydscript`` on the command line.

| Flag | Description |
|---|---|
| `dict_literals` | `{k: v}` literals create Python `dict` objects instead of plain JS objects. On by default. |
| `overload_getitem` | `obj[key]` dispatches to `__getitem__` / `__setitem__` / `__delitem__` on objects that define them. On by default. |
| `overload_operators` | Arithmetic and bitwise operators (`+`, `-`, `*`, `/`, `//`, `%`, `**`, `&`, `\|`, `^`, `<<`, `>>`) dispatch to dunder methods (`__add__`, `__sub__`, etc.) and their reflected variants. Unary `-`/`+`/`~` dispatch to `__neg__`/`__pos__`/`__invert__`. On by default. |
| `truthiness` | Boolean tests and `bool()` dispatch to `__bool__` and treat empty containers as falsy, matching Python semantics. On by default. |
| `bound_methods` | Method references (`obj.method`) are automatically bound to their object, so they can be passed as callbacks without losing `self`. On by default. |
| `hash_literals` | `{k: v}` creates a Python `dict` (alias for `dict_literals`; kept for backward compatibility). On by default. |
| `jsx` | JSX syntax (`<Tag attr={expr}>children</Tag>`) is enabled. On by default. |


Monaco Language Service
-----------------------

The `src/monaco-language-service/` directory contains a browser-native language
service for [Monaco Editor](https://microsoft.github.io/monaco-editor/) (the
editor that powers VS Code). Once registered it provides:

- **Diagnostics** — syntax errors and lint warnings underlined as you type
- **Completions** — Ctrl+Space completions for local variables, functions,
  classes, module imports, built-in functions, and dot-access on user-defined
  and `.d.ts`-typed objects
- **Signature help** — parameter hints triggered by `(` and `,`
- **Hover** — type signature and documentation popup on hover
- **Built-in stubs** — signatures and docs for Python and JavaScript built-ins
  (`len`, `range`, `print`, `sorted`, `any`, `all`, `setTimeout`, …)
- **TypeScript declaration support** — load `.d.ts` files to register external
  globals for completions and hover (e.g. DOM APIs, third-party libraries)

### Building the bundle

The service is distributed as a single self-contained file.  Build it with:

```bash
npm run build:ls
# or with a custom output path:
node tools/build-language-service.js --out path/to/language-service.js
```

The output is written to `language-service/index.js` by default.

### Basic setup

Load the compiler bundle and the language-service bundle, then call
`registerRapydScript` after Monaco is initialised:

```html
<script src="rapydscript.js"></script>
<script src="language-service.js"></script>
<script>
  require(['vs/editor/editor.main'], function () {
    var editor  = monaco.editor.create(document.getElementById('container'), {
      language: 'rapydscript',
    });
    var service = registerRapydScript(monaco, {
      compiler: window.RapydScript,
    });
  });
</script>
```

`registerRapydScript(monaco, options)` registers all Monaco providers and
returns a service handle.  Call `service.dispose()` to remove all providers
when the editor is torn down.

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `compiler` | object | — | **Required.** The `window.RapydScript` compiler bundle. |
| `parseDelay` | number | `300` | Debounce delay (ms) before re-checking after an edit. |
| `virtualFiles` | `{name: source}` | `{}` | Virtual modules available to `import` statements. |
| `stdlibFiles` | `{name: source}` | `{}` | Like `virtualFiles` but treated as stdlib — always available and never produce bad-import warnings. |
| `dtsFiles` | `[{name, content}]` | `[]` | TypeScript `.d.ts` files loaded at startup. |
| `loadDts` | `(name) => Promise<string>` | — | Async callback for lazy-loading `.d.ts` content on demand. |
| `extraBuiltins` | `{name: true}` | `{}` | Extra global names that suppress undefined-symbol warnings. |
| `pythonFlags` | string | — | Comma-separated Python flags to enable globally (e.g. `"dict_literals,overload_getitem"`). See [Python Flags](#python-flags) above. |

### Runtime API

```js
// Add or replace virtual modules (triggers a re-check of all open models)
service.setVirtualFiles({ mymod: 'def helper(): pass' });

// Remove a virtual module
service.removeVirtualFile('mymod');

// Register a .d.ts string at runtime (updates completions, hover, and diagnostics)
service.addDts('lib.dom', dtsText);

// Lazily fetch and register a .d.ts file via the loadDts callback
service.loadDts('lib.dom').then(function () { console.log('DOM types loaded'); });

// Suppress undefined-symbol warnings for additional global names
service.addGlobals(['myFrameworkGlobal', '$']);

// Get the most recently built scope map for a Monaco model (null if not yet analysed)
var scopeMap = service.getScopeMap(editorModel);

// Tear down all Monaco providers and event listeners
service.dispose();
```

### TypeScript declaration files

Pass `.d.ts` content to register external globals for completions and hover.
Supported syntax: `declare var/let/const`, `declare function`,
`declare class`, `interface`, `declare namespace`, and `type` aliases.

```js
var service = registerRapydScript(monaco, {
  compiler: window.RapydScript,
  dtsFiles: [
    {
      name: 'lib.myapi',
      content: [
        'declare namespace MyAPI {',
        '    function fetch(url: string): Promise<any>;',
        '    const version: string;',
        '}',
        'declare var myGlobal: string;',
      ].join('\n'),
    },
  ],
});
```

For large declaration files (e.g. the full DOM lib), use `loadDts` to
fetch them on demand rather than inlining them at startup:

```js
var service = registerRapydScript(monaco, {
  compiler: window.RapydScript,
  loadDts: function (name) {
    return fetch('/dts/' + name + '.d.ts').then(function (r) { return r.text(); });
  },
});

// Trigger loading whenever needed:
service.loadDts('lib.dom');
service.loadDts('lib.es2020');
```

### Virtual modules

Virtual modules let the editor resolve `import` statements without a server.
The completion provider uses them to suggest exported names in
`from X import …` completions.

```js
var service = registerRapydScript(monaco, {
  compiler: window.RapydScript,
  virtualFiles: {
    utils: 'def format_date(d): pass\ndef clamp(x, lo, hi): pass',
    models: 'class User:\n    def __init__(self, name): self.name = name',
  },
});

// Live-update a module as the user edits it in another tab:
service.setVirtualFiles({ utils: updatedSource });
```

### Source maps

The object returned by `RapydScript.web_repl()` exposes a `compile_mapped`
method alongside the standard `compile` method.  `compile_mapped` compiles
RapydScript to JavaScript and simultaneously produces a
[Source Map v3](https://tc39.es/source-map/) JSON string that maps every
position in the generated JavaScript back to the corresponding position in the
original `.py` source.

```js
var repl   = RapydScript.web_repl();
var result = repl.compile_mapped(source, opts);
// result.code      — compiled JavaScript string
// result.sourceMap — Source Map v3 JSON string
```

| Field | Type | Description |
|---|---|---|
| `code` | string | The compiled JavaScript. |
| `sourceMap` | string | Source Map v3 JSON string. `sources` defaults to `['<input>']`; override before use. `sourcesContent` holds the original `.py` source inline so no server fetch is needed. |

**Using with the browser debugger**

Append the source map as an inline data-URL comment.  The browser DevTools then
map runtime errors and breakpoints back to the original `.py` file:

```js
var repl   = RapydScript.web_repl();
var result = repl.compile_mapped(pySource, { export_main: true });

// Set the display name shown in DevTools
var map         = JSON.parse(result.sourceMap);
map.sources     = ['home/user/myscript.py'];
map.sourceRoot  = '/';

var b64  = btoa(unescape(encodeURIComponent(JSON.stringify(map))));
var code = result.code
         + '\n//# sourceURL=home/user/myscript.py'
         + '\n//# sourceMappingURL=data:application/json;base64,' + b64;

// Load as a module blob so DevTools associates the source map with the file
var url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
import(url);
```

When the browser loads that blob the DevTools **Sources** panel shows your
original `.py` file with working breakpoints and correct error stack frames.

**Accepted options** (`opts`)

`compile_mapped` accepts the same options as `compile`:

| Option | Type | Default | Description |
|---|---|---|---|
| `export_main` | bool | `false` | Add `export` to the top-level `main` function. |
| `pythonize_strings` | bool | `false` | Add Python-style string methods to string literals. |
| `keep_baselib` | bool | `false` | Embed the base library in the output. |
| `keep_docstrings` | bool | `false` | Keep docstrings in the output. |
| `js_version` | number | `6` | Target ECMAScript version (5 or 6). |
| `private_scope` | bool | `false` | Wrap the output in an IIFE. |
| `python_flags` | string | — | Comma-separated Python flags to enable for this compilation (e.g. `"dict_literals,overload_operators"`). See [Python Flags](#python-flags) above. Flags set here override any inherited from a previous `compile()` call on a streaming compiler. |
| `virtual_files` | `{name: source}` | — | Map of module-name → RapydScript source for modules importable via `import`. Only used when the underlying streaming compiler was created with a virtual-file context (as `web_repl()` does). |
| `discard_asserts` | bool | `false` | Strip all `assert` statements from the output. |
| `omit_function_metadata` | bool | `false` | Omit per-function metadata (e.g. argument names) from the output for smaller bundles. |
| `write_name` | bool | `false` | Emit a `var __name__ = "…"` assignment at the top of the output. |
| `tree_shake` | bool | `false` | Remove unused imported names from the output (requires stdlib imports). |
| `filename` | string | `'<input>'` | Source filename embedded in the source map and used in error messages. |

**How it works**

The compiler's `OutputStream` tracks the current generated line and column as
it walks the AST.  `compile_mapped` installs a per-compilation hook on
`push_node` — called once per AST node just before its code is emitted — that
records `(generated_line, generated_col) → (source_line, source_col)` pairs.
After code generation those pairs are delta-encoded into Base64-VLQ segments
and assembled into the standard `mappings` field.  The implementation lives in
`tools/embedded_compiler.js` (`vlq_encode`, `build_source_map`,
`print_ast_with_sourcemap`, `compile_with_sourcemap`) and is exposed via
`tools/web_repl.js` (`compile_mapped`).

**Rebuilding the bundle after changes**

```bash
node bin/web-repl-export web-repl          # rebuilds web-repl/rapydscript.js
node tools/build-language-service.js       # rebuilds language-service/index.js
```

### Running the tests

```bash
npm run test:ls
```

This runs all seven language-service test suites (diagnostics, scope analysis,
completions, signature help, hover, DTS registry, and built-in stubs).


Reasons for the fork
----------------------

The fork was created because both the original developer of RapydScript
and the developer of the prior fork rapydscript-ng both did not have 
the time to keep up with the pace of development. Rapydscript has not had
any npm updates since 2020, and rapydscript-ng since 2022.

This fork is not a hostile fork - if development on the prior versions
ever resumes, they are welcome to use the code from this fork. All the
new code is under the same license, to make that possible.

See the [Changelog](https://github.com/ficocelliguy/rapydscript-ns/blob/master/CHANGELOG.md)
for a list of changes to rapydscript-ns, including this fork at version 8.0

---

Example: Tuple Literals
-----------------------

This example demonstrates explicit tuple literals — `()`, `(x,)`, `(a, b)` — and how they interplay with unpacking, isinstance checks, and nested destructuring.

```py
# Empty tuple, single-element tuple, multi-element tuple
empty  = ()
single = (42,)          # trailing comma required; (42) is just the number 42
pair   = (1, 2)
coords = (10.5, -3.7)

print(empty)            # []
print(single[0])        # 42
print(pair)             # [1, 2]

# Tuple as function return value
def minmax(values):
    return (min(values), max(values))

lo, hi = minmax([3, 1, 4, 1, 5, 9])
print(lo, hi)           # 1 9

# isinstance with a tuple of types
def describe(x):
    if isinstance(x, (int, float)):
        return 'number'
    elif isinstance(x, str):
        return 'string'
    return 'other'

print(describe(42))       # number
print(describe('hello'))  # string
print(describe([]))       # other

# Nested tuple unpacking in for loop
points = [(0, 0), (1, 2), (3, 4)]
for x, y in points:
    print(x, y)

# Nested tuple assignment
(a, b), c = (10, 20), 30
print(a, b, c)          # 10 20 30
```
