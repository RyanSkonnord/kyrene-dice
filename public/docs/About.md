About the Project
=================

Welcome! Kyrene Dice is an open-source dice roller and probability calculator for dice pool–based roleplaying games such as _Vampire: The Masquerade_ and White Wolf’s other titles. It’s a tool for investigating the mathematics that underlie this kind of dice-rolling mechanic and how it manifests in gameplay under various conditions.

Motivations
-----------

Calculating a distribution of probable successes on a dice pool is a relatively simple math problem. The _World of Darkness_ rules adding crits or botches add a layer of complexity, but it’s still probably enough complexity to fit into one Python function. I fleshed this project into a webapp, rather than simply writing myself a Python script, in part because I wanted to explore how different rule variants affect the math.

This sort of thing has been a bugbear for the WoD community at least since the rules for botches were changed with Revised Edition, all the way back in 1998. (And if you’re wondering if it still has consequences all these years later, it does. I myself happen to play at a table whose Storyteller still likes to use the pre-Revised rules.) Major edition overhauls, of course, bring bigger changes and can even redefine what it means to talk about a roll succeeding or failing.

A guiding principle of my implementation is that I wanted a single set of game rule implementations to govern both the die roller and the probability calculator alike. The same code that provides rules for an actual roll with particular random numbers is also used to generate the general distribution of all possible rolls. This requires a nontrivial amount of abstraction, but it's worth it to lay the groundwork to ensure that disparity doesn't creep in. Test coverage on the die-rolling feature also provides a good degree of confidence in the correctness of the probability tables. Plus, as a programmer, it was very satisfying to see full probability tables immediately springing to life and absorbing all the detail I had coded into the relatively simple die-rolling feature.

Similar Tools
-------------

As I begin this project, the state of the art for this particular domain niche seems to be the [World of Darkness Dice Pool Calculator on tablegameshub.com](https://tablegameshub.com/world-of-darkness-dice-pool-calculator/). Kyrene Dice tries to improve on that tool by tying the calculator interface a bit more closely to actual game rules and a usable die-roller. Also, as far as I can tell, its source isn’t available.

If you need a robust die-roller and more, [Realm of Darkness](https://realmofdarkness.app/) is the community standard. Kyrene Dice isn’t looking to supplant Realm of Darkness as a general-purpose gaming tool but I hope to offer a few features it doesn’t, specifically around probability calculation and support for niche house rules.

About Me
========

My name is Ryan Skonnord. I’m a software engineer and game enthusiast. I live in the San Francisco Bay Area with my wife and our dog.

My programming background is primarily back-end, in Java and Python, with minor end-to-end duties. My résumé includes [PLOS](https://plos.org/), [Sentry](https://sentry.io/), and [Rescale](https://rescale.com/). Kyrene Dice is my first major project in web development, and has been a nice opportunity to educate myself beyond the basics of TypeScript and React.

I’ve been a fan of _Vampire: The Masquerade_ since the late ’90s (2nd Edition times), when I learned about the game through the geeky tabletop gaming magazines that I read primarily for their _Magic: The Gathering_ content. I had a copy of the 2nd Edition core book and studied it fervently in the hope of playing the game one day, but never succeeded in convincing my friends to try it nor in finding an existing group. I continued to check in with the game over the years, occasionally reading new material from the various editions. In 2023, I decided it was finally time to engage with the game for real, and found an online group that I’m still playing with today.

My wife Diana and I did a podcast called [_Low Stakes – A “Kindred: The Embraced” Rewatch_](https://lowstakes.libsyn.com/). _Low Stakes_ revisits VtM’s 1996 foray into prime-time television, which is fun because Diana was a fan of the show during its original run, before she (or I, for that matter) had ever heard of the game. You can also hear us on Diana’s previous project, [_Happily Ever Aftermath_](https://heamcast.libsyn.com/), and as frequent guests on [_Everything I Learned from Movies_](https://ageofradio.org/everythingilearnedfrommovies/).

Before I got into roleplaying, my main tabletop game was _Magic: The Gathering_. I’ve played in about a dozen Grand Prix events; my proudest achievement was making the cut to second day of the main Modern event at Grand Prix Las Vegas 2017 with a 7-2 record (finishing 10-5 overall). One of my other major programming hobby projects is a Java library related to _Magic_ card data that I call [Lambdagoyf](https://github.com/RyanSkonnord/lambdagoyf) (it’s kind of hard to summarize what that project is about, so I’ll just refer you to its [README](https://github.com/RyanSkonnord/lambdagoyf/blob/main/README.md) doc).

Vital Snippets
--------------

* Favorite VtM clan: Tremere
* Favorite VtR clan: Mekhet
* Favorite _Magic_ color: Black, followed closely by white
* Favorite _Magic_ deck archetype: BGx Midrange
* Favorite D&D class: Wizard, followed closely by paladin
* Preferred programming language: Java

### Personal VtM milestones

* [X] Learn the rules
* [X] Play a game
* [X] Kill an NPC
* [X] Frenzy
* [X] Lose a Humanity point
* [ ] Embrace an NPC
* [ ] Commit diablerie
