#= require api/v2/fishpond

root = exports ? this

# This is the comfortable interface in front of the pond.
#
# @options: Contain configuration to override convention.
#
class root.IFish
  constructor: (fishpond_or_options, options = {}) ->

    # Default options.
    #
    # Contains:
    #  * Selectors
    #  * Callbacks
    #  * System options (not documented to users).
    #
    @options =
      containerSelector: '#ifish'       # Selector for the container surrounding the iFish elements.
      resultsSelector: 'ul.results'     # Selector for the results list.
      fishSelector: 'li'                # Selector for the fish inside the results/favorites container.
      controlsSelector: 'form.controls' # Selector for the HTML element containing iFish controls.
      searchSelector: 'form.search'     # Selector for the HTML element containing the search field.
      favoritesSelector: '#favorites'   # Selector for the HTML element containing the favorites.
      totopSelector: '.totop'           # Make element inside fish clickable (to send to top).
      favoriteSelector: '.favorite'     # Make element inside a fish or favorite clickable (and add/remove to/from favorites).

      # Isotope.
      #
      isotope:
        sortBy: 'score'
        layoutMode: 'masonry'
        getSortData:
          score: (item) -> parseInt $(item).attr('data-score'), 10

      # Callbacks.
      #
      # Fishpond.
      #
      fishpondResultsUpdated: @fishpondResultsUpdated # Callback when results have been updated.
      fishpondLoading: @fishpondLoading               # Callback when fishpond is loading.
      fishpondReady: @fishpondReady                   # Callback when fishpond is ready.

      # Client-only callbacks (defaults do nothing).
      #
      # Favorites.
      #
      pondReady: (pond) -> pond
      afterInitialisingFavorites: (favorites) -> favorites
      beforeAddFavorite: (fish) -> fish
      afterAddFavorite: (fish) -> fish
      beforeRemoveFavorite: (favorite) -> favorite
      afterRemoveFavorite: (favorite) -> favorite
      beforeLoadFavorite: (fish) -> fish
      beforeLoadFavorites: (ids) -> ids
      afterLoadFavorites: (favorites) -> favorites
      beforeApplyBindings: (view, container) -> view
      afterApplyBindings: (view, container) -> view
      ready: (pond) -> pond

      # Metadata.
      #
      metadata: false # Initially load unloaded metadata (very slow on large ponds).
      
      # Dev.
      #
      development: false
      debug: false

    # Override system options using heuristics.
    #
    if /localhost|ngrok/.test document.domain
      $.extend @options, { development: true, debug: false }

    # Check if a Fishpond has been given.
    #
    # Extend options if not.
    #
    if fishpond_or_options instanceof Fishpond
      @fishpond = fishpond_or_options
    else
      # Override default options with the given options (deeply).
      #
      $.extend true, @options, fishpond_or_options

    # Set up container and extract data.
    #
    @container    = if @options.containerSelector instanceof jQuery then @options.containerSelector else $ @options.containerSelector
    @api_key      = @options.apiKey      || @container.data 'api_key'
    @pond_id      = @options.pondId      || @container.data 'pond_id'
    @api_endpoint = @options.apiEndpoint || @container.data 'api_endpoint'

    # Override default options from container data options.
    #
    $.extend @options, { api_endpoint: @api_endpoint }

    # Set up view elements.
    #
    @results = $ @options.resultsSelector, @container
    @controls = $ @options.controlsSelector, @container
    @search = $ @options.searchSelector, @container
    
    # Favorites do not need to be contained under the container.
    #
    @favorites = $ @options.favoritesSelector

    # Warnings.
    #
    @warn "Could not find a results container under #{@results.selector}." if @results.length == 0
    @warn "Could not find a results container under #{@results.selector}." if @results.length == 0
    @warn "Could not find an ifish controls container under #{@controls.selector}." if @controls.length == 0
    @warn "Could not find a search field under #{@search.selector}." if @search.length == 0
    @warn "Could not find a favorites container under #{@favorites.selector}." if @favorites.length == 0

    # Add a knockout view model.
    # Update this to update the controls/fish.
    #
    @view = {}

    # Finally, set up fishpond, if options have been given.
    #
    unless fishpond_or_options instanceof Fishpond
      @fishpond = new Fishpond @api_key, @options
      @fishpond.loading @options.fishpondLoading
      @fishpond.ready (pond) =>
        @options.pondReady pond
        @installControls pond, @options.fishpondReady
        @options.ready pond
      @fishpond.resultsUpdated @options.fishpondResultsUpdated
      @fishpond.init @pond_id

  # Debug.
  #
  puts: (message) => console.log "[iFish] #{message}"
  info: (message) => @puts "Info: #{message}"
  warn: (message) => @puts "Warning: #{message}"

  # Installs iFish controls based on the given pond.
  #
  # @method fishpondReady
  # @param {Fishpond::Pond} pond A ready-to-go pond
  # @param {function} finished A callback function to call after finishing
  #
  installControls: (pond, finished) =>
    # Map fish for easy retrieval.
    #
    @mappedFish = {}
    @fishIds = []
    for fish in pond.fish
      @mappedFish[fish.id] = fish
      @fishIds.push fish.id

    # Set up view model.
    #
    @view.name = ko.observable pond.name

    # Hook/expose view model functions into the iFish lib.
    #
    @view.setSortValues = @setSortValues
    @view.isFavorite = @isFavorite
    @view.addFavorite = @addFavorite
    @view.removeFavorite = @removeFavorite

    # Fish
    #
    # Note: Callback is triggered after fish are loaded and initialized.
    #
    @initializeFish pond, (fish) =>
      #
      #
      @view.fish = ko.observableArray fish
      
      # Controls
      #
      @view.tags = ko.observableArray pond.tags.map (tag) -> $.extend tag, value: 10
      #
      # Preprocess groups.
      #
      grouped = {}
      pond.filters.map (tag) ->
        $.extend tag, value: 1
        grouped[tag.group] ||= []
        grouped[tag.group].push tag
      groupedArrays = []
      $.each grouped, (i, group) ->
        groupedArrays[i] = { id: i, filters: ko.observableArray group }
      @view.filterGroups = ko.observableArray groupedArrays
      
      # favorites
      #
      @view.favorites = ko.observableArray []
      @options.afterInitialisingFavorites @view.favorites
      @view.favorites @loadFavorites(pond, fish)
      #
      # Each time the favorites are modified, store them in localStorage.
      #
      @view.favorites.subscribe (fish) =>
        ids = $.map @view.favorites(), (favorite) -> favorite.id
        localStorage.setItem @localStorageKey(pond, 'favorites'), ids

      # Add community tag.
      #
      @view.tags.push
        has_binary_options: false
        id: "community"
        name: "Community"
        slug: "community"
        value: 10

      # Trigger knockout.
      #
      @options.beforeApplyBindings @view, @container
      #
      # Apply the bindings to the enclosing containers.
      #
      for element in @container
        @info "Applying dynamic bindings to #{element.tagName}##{element.id}."
        ko.applyBindings @view, element
      #
      @options.afterApplyBindings @view, @container

      # Redraw all fish.
      #
      @refresh fish

      # Call finished callback.
      #
      finished pond

  #
  #
  refresh: (fish) ->
    $.each fish, (_, f) ->
      f.visible.notifySubscribers()

  # Loads favorites from local storage.
  #
  # @method loadFavorites
  # @param {Fishpond} pond A fishpond
  # @param {Fishpond::Fish} fish A fish
  #
  loadFavorites: (pond, fish) =>
    idsString = localStorage.getItem @localStorageKey(pond, 'favorites')
    if idsString
      ids = idsString.split ','
    else
      ids = []
    ids = @options.beforeLoadFavorites ids
    favorites = $.map ids, (id) =>
      @options.beforeLoadFavorite @mappedFish[id]
    favorites = @options.afterLoadFavorites favorites
    favorites

  # Adds a fish to the favorites.
  #
  # @method addFavorite
  # @param {Fishpond::Fish} fish A fish
  #
  addFavorite: (fish) =>
    unless @isFavorite fish
      fish = @options.beforeAddFavorite fish
      @view.favorites.push fish
      @options.afterAddFavorite fish
  
  # Is a fish a favorite?
  #
  # @method isFavorite
  # @param {Fishpond::Fish} fish A fish
  #
  isFavorite: (fish) =>
    found = false
    if @view.favorites
      $.each @view.favorites(), (i, favorite) ->
        found = true if favorite.id == fish.id
    found

  # Removes a fish from the favorites.
  #
  # @method removeFavorite
  # @param {Fishpond::Fish} fish A fish
  #
  removeFavorite: (fish) =>
    if @isFavorite fish
      fish = @options.beforeRemoveFavorite fish
      @view.favorites.remove fish
      @options.afterRemoveFavorite fish

  # Generate a localStorage key for the given pond and type.
  #
  # @method localStorageKey
  # @param {Fishpond} pond A fishpond
  # @param {String} type A string to define what is stored
  #
  localStorageKey: (pond, type) -> "ifish-#{pond.id}-#{type}"

  #
  #
  addStarterKitFunctions: (fish) =>
    fish.score = ko.observable 100
    fish.visible = ko.observable 1
    fish.fromMetadata = ko.computed ->
      # Use dummy observable to trigger computable recalculation.
      #
      fish.visible() && fish.metadata
    fish.isFavorite = ko.computed =>
      fish.visible() && @isFavorite fish
      

  # Initialize the fish.
  #
  initializeFish: (pond, afterInitialize) =>
    pondSize = pond.fish.length
    fishWithMetadata = []
    pond.fish.map (fish) =>
      callback = (fish) => # Empty.
        @addStarterKitFunctions fish
        fishWithMetadata.push fish
        afterInitialize fishWithMetadata if fishWithMetadata.length == pondSize
      if @options.metadata
        fish.get_metadata callback
      else
        callback fish

  # Update all fish with new results.
  # Sets all fish invisible, then shows only the ones in the result.
  #
  updateFish: (results) ->
    $.each @view.fish(), (i, fish) -> fish.visible 0
    $.each results, (i, result) ->
      fish = result.fish
      fish.score result.score
      fish.visible 1
      fish

  sliderFor: (token) ->
    @controls.find ".slider[data-target='query[tags][#{token}]']"

  filterFor: (token) ->
    @controls.find "input[name='query[filters][#{token}]']"

  # Let isotope know to update the view.
  #
  updateView: ->
    @results.isotope('updateSortData', @results.find(@options.fishSelector)).isotope()

  # Sets the tag and filter value such that the given fish has a score of 0 (best).
  #
  # @method setInputValues
  # @param {Fishpond::Fish} fish A fish
  #
  setInputValues: (fish) =>
    @setSortValues fish
    @setFilterValues fish

  setSortValues: (fish) =>
    for token, value of fish.tags
      @sliderFor(token).slider "value", value

  setFilterValues: (fish) =>
    for token, value of fish.tags
      if value >= 1
        # We have to explicitly trigger the change event.
        #
        @filterFor(token).attr('checked', 'checked').change()

  # Fishpond results updated handler
  #
  # @method fishpondResultsUpdated
  # @param {Array} Array Fishpond::Result objects
  #
  fishpondResultsUpdated: (results) =>
    @updateFish results
    @updateView()

  # Fishpond loading callback method.
  #
  # @method fishpondLoading
  # @param {Float} percentage Total loading percent complete
  #
  fishpondLoading: (percentage) =>
    $(".progress .bar", @container).width (percentage * 100) + "%"

  # Fishpond ready handler.
  #
  # @method fishpondReady
  # @param {Fishpond::Pond} pond A ready-to-go pond
  #
  fishpondReady: (pond) =>
    @installSliders()
    @controls.find('input:checkbox').change @checkboxChanged
    @installSearchField(pond)
    @showInterface()
    @installDialog()

    isotopeOptions = $.extend {
      itemSelector: @options.fishSelector,
      filter: @options.fishSelector + '[data-visible="1"]'
    }, @options.isotope
    @results.isotope isotopeOptions

  installDialog: () =>
    $.each @results.find(@options.fishSelector), (i, li) =>
      li = $(li)
      dialog = li.find '.dialog'
      li.click (event) =>
        element = event.currentTarget
        fish = ko.dataFor element
        fish.get_metadata (fish) =>
          # Trigger dummy observable to trigger fromMetadata
          # computable reevaluation.
          #
          fish.visible.notifySubscribers()
          dialog.modal('toggle')
    # Append to body to move out of the original structure.
    #
    @results.find('li .dialog').appendTo("body").modal('hide')

  installSliders: () =>
    @controls.find('.slider').slider
      value: 10
      min: 0
      max: 20
      step: 0.1
      slide: @sliderChanged
      change: @sliderChanged

  # Show the standard fish interface.
  #
  showInterface: () ->
    $(".progress").removeClass "active"
    $(".loading").delay(500).fadeOut 200
    $(".form-and-results", @container).delay(1000).removeClass('hidden')
    @favorites.delay(500).removeClass 'hidden'
    # TODO: @sendQuery()
    
  # Install the search field functionality.
  #
  installSearchField: (pond) ->
    mappedFish = @mappedFish;
    
    format = []
    searchedFields = @options.search && @options.search.fields || ['title']
    if @options.search && @options.search.format
      format = @options.search.format
    else
      for field in searchedFields
        format.push '%s'
      format = format.join ', '
    
    from = (fish, name) ->
      fish[name] || fish.metadata[name]
      
    typeaheadOptions = $.extend
      items: 5
      source: @fishIds
      matcher: (item) ->
        fish = mappedFish[item]
        result = false
        for field in searchedFields
          result ||= from(fish, field).score(this.query) > 0.1
        result
      sorter: (items) ->
        query = this.query
        items.sort (item1, item2) =>
          fish1  = mappedFish[item1]
          fish2  = mappedFish[item2]
          score1 = 0
          score2 = 0
          for field in searchedFields
            score1 += from(fish1, field).score(query)
            score2 += from(fish2, field).score(query)
          if score1 > score2
            -1
          if score1 < score2
            1
          0
        items
      highlighter: (item) =>
        fish = @mappedFish[item]
        highlighted = format
        for field in searchedFields
          highlighted = highlighted.replace /%s/, from(fish, field)
        highlighted
      updater: (item) =>
        fish = @mappedFish[item]
        @controls.find("input[name^='query[filters]']:checkbox").removeAttr 'checked'
        @setSortValues fish
        @sendQuery()
        fish.title
      , @options.search
    @search.find('input[type="text"]').typeahead typeaheadOptions


  # jQuery UI slider slide and change event handler
  #
  # @method sliderChanged
  # @param {Event} e A jQuery event
  # @param {DOMElement} ui A jQuery slider
  #
  sliderChanged: (e, ui) =>
    slider = $ ui.handle.parentNode
    label = slider.parents('.control-group').find('label:first')
    hiddenField = $ "input[name='" + slider.data('target') + "']"
    value = Math.round ui.value

    if value.toString() != hiddenField.val().toString()
      hiddenField.val value
      label.html label.html().split("(")[0] + " (" + value.toString() + ")"
      @sendQuery()

  # Checkbox state change handler.
  #
  # @method checkboxChanged
  #
  checkboxChanged: => @sendQuery()

  #Compiles and processes a query.
  #
  # @method sendQuery
  #
  sendQuery: =>
    $("form#search input").val ""
    tags = {}
    filters = {}

    @controls.find("input[name*='tags']").each ->
      if $(this).siblings("input:checked").length == 0
        tags[$(this).data('slug')] = 0
      else
        tags[$(this).data('slug')] = $(this).val()

    @controls.find("input[name*='filters']").each ->
      value = 0
      if this.checked
        value = 1

      filters[$(this).data('slug')] = value

    @fishpond.query tags, filters