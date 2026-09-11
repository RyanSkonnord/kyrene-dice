# Webapp known issues

## Bugs

* The informational tooltips appear underneath number pickers. The ones for Classic WoD variants are largely illegible because of their positioning.
* The icons in the "goal view" balls for Fifth Edition are off-center.

## Performance problems

* The multinomial math means that we can efficiently calculate probabilities even for large dice pools if they consist of a single "part". However, we still see some quadratic-time slowness when merging two or more "stages" in `RollProbabilityDistribution`. You can observe this with a large dice pool in CoD, as well as in Fifth with a large dice pool and five Hunger dice. This can be optimized by refactoring out the step of merging multiple stages, which will require making the math a bit fancier in order to model the game mechanics in question.

## Refactoring

* Roll spec dependencies between components may be better handled as a context (rather than injecting callbacks as dependencies).
* I'm not sure that the `DieTag` abstraction is pulling its weight. It's currently doing two jobs poorly: signaling when to use a different resolution table (i.e., a 1 on a Hunger die has a different meaning than a normal die) and controlling display details.

## Potential features

* A global settings menu with options to:
    * Hide or show probability tables by default.
    * Turn sound effects on or off (when we have them).
    * Opt in to the feature that highlights especially lucky or unlucky rolls.
* Customizable dice styles and color schemes.

### Game rule support

* Support for Nightmare dice (from _Changeling_) in Classic WoD.
* The Fifth Edition mode is shamelessly VtM-centric. _Werewolf_ and _Hunter_ have their own rules that I'd like to support. These would mostly be cosmetic changes to how crits are reported.
* Expand the Fifth Edition "goal view" for other systems. (Other systems don't have a "goal" to reach, but a visual representation for counting hits and crits might still be nice.)

### User experience

* Retain roll spec values and roll history as cookies.
* Graphical charts (most likely using [Chart.js](https://www.chartjs.org/)) to augment or optionally replace the numeric probability tables.
* An export button to copy rolls to the clipboard (handy for online games, even if it only works on the honor system) or to download probability charts (CSV, JSON?).
* Optional sound effects to accompany dice rolls.
* An optional feature that, when a roll has an especially unlikely outcome, generates a message to the user, highlighting and quantifying how lucky or unlucky they were. This would be less interesting if probability charts are visible by default, but could be a lot of fun if the app (particularly as a Discord bot) is being used for dice rolls in actual gameplay.

## Cosmetic improvements

* Mobile responsiveness is needed.
* The "roll history" pane needs better flow in both the horizontal and vertical directions.
* Roll view:
    * The blobs of text describing the roll conditions and outcomes should be replaced by punchier visual elements. Probably each parameter or flag in its own little rectangular tile.
    * The Fifth Edition "goal balls" need another pass. The plain white circle indicating a hit makes the ball look like a donut. I want to replace it, maybe with a bullseye icon.
    * If I get the goal view icons to a state I'm happy with, I'd like to place them inside the die graphics, where they would (along with the die's interior color) symbolize the die's effect.
        * If we have that feature, it would also be cool to have an optional mode where the die shows only an icon (large and in the center) and doesn't show a number at all.
    * A checkbox isn't really the best metaphor to use for the "Amend" feature. It should be changed to a button with some kind of indicator.
        * Ideally, indicate that a roll is being amended by changing its background color, and at the same time, apply the same color change to the two panels that update its parameters, for a sense of visual linkage.
* Coloring and decoration:
    * The overall color scheme with the backgrounds is admittedly janky. I want to make the colors prettier.
    * The hyperbolic color scheme for the success rows needs tweaking. It makes a nice gradient effect as it is, but the change is a little too subtle to sell the intended idea that N successes are always the same color.
    * The background gradient is not supposed to repeat like that when the page gets big enough to vertically scroll.

# Potential expansions of the project scope

* A Discord bot that can generate and post dice rolls, with the full feature set of the webapp. Making them publicly visible in a shared space would be essential for using the dice-rolling features in actual games.
* Stand-alone apps for Android and/or iPhone. This is a low priority, as the webapp should suffice for mobile users (once it has a decent responsive layout). But it might have a niche use for users without internet service.
* Adding some kind of back end with persistent user data would open up various new possibilities. I don't know if I would ever do this, but it would be a first step toward expanding from a dice roller to a more general gameplay utility suite.
