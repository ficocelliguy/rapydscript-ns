# README Review: Informal / Emotional / Personal Writing

The following passages use first-person voice, editorial opinion, or emotional
language that is inconsistent with neutral technical documentation. Locations
are approximate line numbers in the pre-edit README (offsets may shift slightly
after the factual fixes applied in the same session).

---

## 1. Getting Started — dismissive opener

> *"Let's not waste any more time with the introductions, however. The best way
> to learn a new language/framework is to dive in."*

First-person plural ("Let's"), informal register. A neutral transition would
simply move to the next section without the aside.

---

## 2. Anonymous Functions — authorial opinion

> *"I'm sure you will agree that the above code is cleaner than declaring 5
> temporary variables first…"*

Addresses the reader directly with an appeal to agreement. Technical writing
states the fact (fewer variables) without soliciting assent.

> *"I'll refer to it as function inlining."*

First-person. Use "This pattern is called function inlining" instead.

---

## 3. Chaining Blocks — hedged endorsement

> *"Some of you might welcome this feature, some of you might not. RapydScript
> always aims to make its unique features unobtrusive to regular Python, which
> means that you don't have to use them if you disagree with them."*

Speaks to a hypothetical audience split and frames the feature as something
one might "disagree with." Technical docs describe what a feature does and when
to use it; they do not pre-litigate reader opinions.

---

## 4. Inferred Tuple Packing — Zen of Python aside

> *"While inferred/implicit logic is usually bad, it can sometimes make the
> code cleaner, and based on the order of statements in the Zen of Python,
> 'beautiful' takes priority over 'explicit'."*

Rhetorical justification citing a poem. The feature can be described on its
own merits without philosophical framing.

---

## 5. Classes intro — value judgment

> *"This is where RapydScript really starts to shine. JavaScript is known for
> having really crappy class implementation (it's basically a hack on top of a
> normal function, most experienced users suggest using external libraries for
> creating those instead of creating them in pure JavaScript)."*

"Really starts to shine" is promotional. "Really crappy" is colloquial and
dismissive of another language. "Most experienced users suggest" is an
unsourced appeal to authority. A neutral version would describe the prototype-
based model and what RapydScript adds without editorializing.

---

## 6. Available Libraries — first-person throughout

> *"It is for that reason that I try to keep RapydScript bells and whistles to
> a minimum."*

> *"To prove that, I have implemented lightweight clones of several popular
> Python libraries…"*

> *"I'd be happy to include more libraries, if other members of the community
> want to implement them (it's fun to do, `re.pyj` is a good example)…"*

All three use first-person singular. The section reads as a personal note from
the original author rather than project documentation. The parenthetical "(it's
fun to do)" is particularly informal. These should be rewritten in the third
person or passive voice, or removed entirely if the information is not useful
to users.

---

## 7. Available Libraries — outdated reference

> *"Indeed, plugging `underscore.js` in place of RapydScript's `stdlib` will
> work just as well, and some developers may choose to do so, after all,
> `underscore.js` is very Pythonic and very complete."*

`underscore.js` has been largely superseded by `lodash` and by native ES6+
features. This sentence makes a dated recommendation and uses the informal
"after all." Consider removing or updating the reference.

---

## 8. External Libraries (Advanced Usage) — personal preference

> *"To keep code legible and consistent, I strongly prefer the use of
> `@external` decorator over the `new` operator for several reasons…"*

First-person preference. State this as a recommendation ("The `@external`
decorator is preferred because…") rather than a personal opinion.

---

## Summary

| # | Section | Issue type |
|---|---------|------------|
| 1 | Getting Started | First-person plural, informal opener |
| 2 | Anonymous Functions | Reader-addressed opinion; first-person label |
| 3 | Chaining Blocks | Audience-split hedging; "disagree with" framing |
| 4 | Inferred Tuple | Philosophical justification; Zen of Python citation |
| 5 | Classes intro | Promotional language; colloquial insult to JS |
| 6 | Available Libraries | Repeated first-person singular; "(it's fun to do)" |
| 7 | Available Libraries | Dated recommendation; informal "after all" |
| 8 | Advanced Usage | First-person personal preference |
