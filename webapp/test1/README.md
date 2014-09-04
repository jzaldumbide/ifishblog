# iFish Starter Kit

Hello!

The fishpond starter is a JS library that works with iFish.
It will set up a user interface automatically from your pond configuration.

## Starting out

### HTML

1. `git clone` this repository.
2. Into `index.html` Insert your data API key you have received on `ifish.io` and a pond id.
3. Try whether it works by opening `index.html`.
4. Start modifying the `index.html`.

### CSS

#### Editing CSS directly

1. Modify `stylesheets/application.css`
2. Reload the page.

#### Using SASS (http://sass-lang.com/)

1. Run `gem install sass`.
2. Modify `stylesheets/application.sass`.
3. Run `sass stylesheets/application.sass > stylesheets/application.css`.
4. Reload the page.

## Concepts

The iFish starter kit introduces two concepts:

* Templates
* Data Bindings

## Templates

Templates are pieces of HTML contained in other HTML that will be used to display repetitively.

For example, inside the results (selector `#results ul`), the `li` designates the fish template:

    <!-- Inside here is a fish template to change as you wish. -->
    <li class='span4'>
      <div class='thumbnail'>
        <h4 data-bind='text: title'></h4>
        <small><a class="totop">To Top</a></small>
        <small data-bind='text: score'></small>
        <small><a class="favorite">Favorite</a></small>
      </div>
    </li>

If your pond has 30 fish, then this template will be used 30 times to display the fish.

But what if each fish has a different title? Won't each fish have the same template is rendered 30 times?

That's what data bindings are for. They fill in data from fish into the fish template.

## Data Bindings

The iFish starter kit uses data bindings to connect the view (the HTML) with Javascript models (the fish).

Wherever you see the HTML attribute `data-bind`, data from the fish is inserted into the HTML.

For example, in the HTML part of a fish we have:

    <h4 data-bind='text: title'></h4>

That means that the text for the `h4` is taken from the fish title.

These can be quite complex:

    <h4 data-bind='text: "hello " + title() + " hello"'></h4>

There is more documentation about the `text` data binding here:

http://knockoutjs.com/documentation/text-binding.html

Read more about data bindings in general in the Knockout documentation:

http://knockoutjs.com/documentation/introduction.html

## Options

At the end of the `index.html`, you'll find:

    new IFish();

This sets everything up. You can pass it the following options (here shown with defaults):

      containerSelector: 'section#query', # Selector for the container surrounding the iFish elements.
      resultsSelector: '#results ul', # Selector for the results list.
      controlsSelector: '#fish', # Selector for the HTML element containing iFish controls.
      searchSelector: '#search', # Selector for the HTML element containing the search field.
      favoritesSelector: '#favorites', # Selector for the HTML element containing the favorites.
      fishSelector: 'li', # Selector for the fish inside the results/favorites container.

      totopSelector: '.totop', # Make element inside fish clickable (to send to top).
      favoriteSelector: '.favorite', # Make element inside a fish or favorite clickable (and add/remove to/from favorites).

      fishpondResultsUpdated: @fishpondResultsUpdated, # Callback when results have been updated.
      fishpondLoading: @fishpondLoading, # Callback when fishpond is loading.
      fishpondReady: @fishpondReady, # Callback when fishpond is ready.

      metadata: false, # Initially load metadata (very slow on large ponds).