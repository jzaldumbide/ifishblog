/*! fishpond-client v1.1.2 | 2014-08-04 */
//----------------------------------
// Taken from: http://stackoverflow.com/questions/2790001/fixing-javascript-array-functions-in-internet-explorer-indexof-foreach-etc
//

// Add ECMA262-5 method binding if not supported natively
//
if (!('bind' in Function.prototype)) {
    Function.prototype.bind= function(owner) {
        var that= this;
        if (arguments.length<=1) {
            return function() {
                return that.apply(owner, arguments);
            };
        } else {
            var args= Array.prototype.slice.call(arguments, 1);
            return function() {
                return that.apply(owner, arguments.length===0? args : args.concat(Array.prototype.slice.call(arguments)));
            };
        }
    };
}

// Add ECMA262-5 string trim if not supported natively
//
if (!('trim' in String.prototype)) {
    String.prototype.trim= function() {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    };
}

// Add ECMA262-5 Array methods if not supported natively
//
if (!('indexOf' in Array.prototype)) {
    Array.prototype.indexOf= function(find, i /*opt*/) {
        if (i===undefined) i= 0;
        if (i<0) i+= this.length;
        if (i<0) i= 0;
        for (var n= this.length; i<n; i++)
            if (i in this && this[i]===find)
                return i;
        return -1;
    };
}
if (!('lastIndexOf' in Array.prototype)) {
    Array.prototype.lastIndexOf= function(find, i /*opt*/) {
        if (i===undefined) i= this.length-1;
        if (i<0) i+= this.length;
        if (i>this.length-1) i= this.length-1;
        for (i++; i-->0;) /* i++ because from-argument is sadly inclusive */
            if (i in this && this[i]===find)
                return i;
        return -1;
    };
}
if (!('forEach' in Array.prototype)) {
    Array.prototype.forEach= function(action, that /*opt*/) {
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this)
                action.call(that, this[i], i, this);
    };
}
if (!('map' in Array.prototype)) {
    Array.prototype.map= function(mapper, that /*opt*/) {
        var other= new Array(this.length);
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this)
                other[i]= mapper.call(that, this[i], i, this);
        return other;
    };
}
if (!('filter' in Array.prototype)) {
    Array.prototype.filter= function(filter, that /*opt*/) {
        var other= [], v;
        for (var i=0, n= this.length; i<n; i++)
            if (i in this && filter.call(that, v= this[i], i, this))
                other.push(v);
        return other;
    };
}
if (!('every' in Array.prototype)) {
    Array.prototype.every= function(tester, that /*opt*/) {
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this && !tester.call(that, this[i], i, this))
                return false;
        return true;
    };
}
if (!('some' in Array.prototype)) {
    Array.prototype.some= function(tester, that /*opt*/) {
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this && tester.call(that, this[i], i, this))
                return true;
        return false;
    };
}

/*
* Lightweight JSONP fetcher
* Copyright 2010-2012 Erik Karlsson. All rights reserved.
* BSD licensed
*/


/*
* Usage:
*
* JSONP.get( 'someUrl.php', {param1:'123', param2:'456'}, function(data){
*   //do something with data, which is the JSON object you should retrieve from someUrl.php
* });
*/
var JSONP = (function(){
	var counter = 0, head, window = this, config = {};
	function load(url, pfnError) {
		var script = document.createElement('script'),
			done = false;
		script.src = url;
		script.async = true;

		var errorHandler = pfnError || config.error;
		if ( typeof errorHandler === 'function' ) {
			script.onerror = function(ex){
				errorHandler({url: url, event: ex});
			};
		}

		script.onload = script.onreadystatechange = function() {
			if ( !done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") ) {
				done = true;
				script.onload = script.onreadystatechange = null;
				if ( script && script.parentNode ) {
					script.parentNode.removeChild( script );
				}
			}
		};

		if ( !head ) {
			head = document.getElementsByTagName('head')[0];
		}
		head.appendChild( script );
	}
	function encode(str) {
		return encodeURIComponent(str);
	}
	function jsonp(url, params, callback, callbackName) {
		var query = (url||'').indexOf('?') === -1 ? '?' : '&', key;

		callbackName = (callbackName||config['callbackName']||'callback');
		var uniqueName = callbackName + "_json" + (++counter);

		params = params || {};
		for ( key in params ) {
			if ( params.hasOwnProperty(key) ) {
				query += encode(key) + "=" + encode(params[key]) + "&";
			}
		}

		window[ uniqueName ] = function(data){
			callback(data);
			try {
				delete window[ uniqueName ];
			} catch (e) {}
			window[ uniqueName ] = null;
		};

		load(url + query + callbackName + '=' + uniqueName);
		return uniqueName;
	}
	function setDefaults(obj){
		config = obj;
	}
	return {
		get:jsonp,
		init:setDefaults
	};
}());

(function() {
  var root,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty;

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  root.Fishpond = (function() {
    function Fishpond(api_key, options) {
      var _fishpond;
      this.api_key = api_key;
      this.options = options != null ? options : {};
      this.created_at = new Date();
      this._ready = false;
      this.log("Creating fishpond instance");
      this.connection = new Fishpond.prototype.Connection(this);
      _fishpond = this;
      this.loading(function(percent_complete) {
        return _fishpond.log("Loading " + (percent_complete * 100) + "%");
      });
      this.ready(function(pond) {
        return _fishpond.log("Ready to query '" + pond + "'");
      });
      this.error(function(msg) {
        _fishpond.log("Error");
        return _fishpond.log(msg);
      });
      this.resultsUpdated(function(results) {
        _fishpond.log("Results updated");
        return _fishpond.raw_log(results);
      });
    }

    Fishpond.prototype.init = function(pond_id) {
      var _fishpond;
      this.pond_id = pond_id;
      _fishpond = this;
      this.log("Init with pond " + this.pond_id);
      _fishpond.trigger('loading', 0.0);
      return this.connection.request(['ponds', this.pond_id], function(response) {
        _fishpond.pond = new Fishpond.prototype.Pond(_fishpond);
        _fishpond.pond.build(response);
        _fishpond.debug("Loaded pond '" + _fishpond.pond + "'");
        return _fishpond.pond.load_all_fish(function() {
          _fishpond.trigger('loading', 1.0);
          this._ready = true;
          _fishpond.log("Ready");
          return _fishpond.trigger('ready', _fishpond.pond);
        });
      });
    };

    Fishpond.prototype.trigger = function() {
      var args, callback;
      callback = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return this.callbacks[callback](args[0]);
    };

    Fishpond.prototype.time_alive = function() {
      return parseInt((new Date - this.created_at) / 1000, 10);
    };

    Fishpond.prototype.enable_event_tracking = function(ga_id, domain) {
      var ga, s, subdomain, _gaq;
      this.event_tracking_enabled = true;
      _gaq = _gaq || [];
      _gaq.push(['_setAccount', ga_id]);
      _gaq.push(['_setDomainName', domain]);
      _gaq.push(['_setAllowLinker', true]);
      _gaq.push(['_trackPageview']);
      ga = document.createElement('script');
      ga.type = 'text/javascript';
      ga.async = true;
      subdomain = 'http://www';
      if ('https:' === document.location.protocol) {
        subdomain = 'https://ssl';
      }
      ga.src = "" + subdomain + ".google-analytics.com/ga.js";
      s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(ga, s);
      return this.log("Event tracking enabled with ID " + ga_id + " on " + domain);
    };

    return Fishpond;

  })();

  Fishpond.prototype.track = function(category, action, label, value) {
    if (this.event_tracking_enabled) {
      this.log("Tracking: " + category + " | " + action + " | " + label + " | " + value);
      return _gaq.push(['_trackEvent', category, action, label, value]);
    }
  };

  Fishpond.prototype.loading = function(callback) {
    this.callbacks || (this.callbacks = {});
    return this.callbacks['loading'] = callback;
  };

  Fishpond.prototype.ready = function(callback) {
    this.callbacks || (this.callbacks = {});
    return this.callbacks['ready'] = callback;
  };

  Fishpond.prototype.error = function(callback) {
    this.callbacks || (this.callbacks = {});
    return this.callbacks['error'] = callback;
  };

  Fishpond.prototype.resultsUpdated = function(callback) {
    this.callbacks || (this.callbacks = {});
    return this.callbacks['resultsUpdated'] = callback;
  };

  Fishpond.prototype.Connection = (function() {
    function Connection(fishpond) {
      this.fishpond = fishpond;
      this.fishpond.debug("Connection created");
      this.api_endpoint = "http://www.ifish.io/api";
      this.request_queue = [];
      this.current_requests = 0;
      this.max_simultaneous_requests = 2;
      if (this.fishpond.options['development']) {
        this.fishpond.debug("Development connection selected");
        this.api_endpoint = "http://" + window.location.host + "/api";
      }
      if (this.fishpond.options['api_endpoint']) {
        this.api_endpoint = fishpond.options['api_endpoint'];
      }
      this.fishpond.debug("Using API endpoint " + this.api_endpoint);
    }

    Connection.prototype.api_resource_url = function(resource) {
      return [this.api_endpoint, resource].join("/");
    };

    Connection.prototype.request = function(resource_pieces, callback, data) {
      return this.send_request(resource_pieces.join("/"), callback, data);
    };

    Connection.prototype.parameterize_data = function(params) {
      var pairs, proc;
      pairs = [];
      (proc = function(object, parent_prefix) {
        var el, i, key, prefix, value, _results;
        _results = [];
        for (key in object) {
          if (!__hasProp.call(object, key)) continue;
          value = object[key];
          prefix = parent_prefix;
          if (value instanceof Array) {
            _results.push((function() {
              var _i, _len, _results1;
              _results1 = [];
              for (i = _i = 0, _len = value.length; _i < _len; i = ++_i) {
                el = value[i];
                _results1.push(proc(el, prefix != null ? "" + prefix + "[" + key + "][]" : "" + key + "[]"));
              }
              return _results1;
            })());
          } else if (value instanceof Object) {
            if (prefix != null) {
              prefix += "[" + key + "]";
            } else {
              prefix = key;
            }
            _results.push(proc(value, prefix));
          } else {
            _results.push(pairs.push(prefix != null ? "" + prefix + "[" + key + "]=" + value : "" + key + "=" + value));
          }
        }
        return _results;
      })(params, null);
      return pairs.join('&');
    };

    Connection.prototype.process_request = function(resource, callback, post_data) {
      var data, full_request_url, parameter_string, url, _connection, _fishpond;
      this.fishpond.debug("Requesting " + resource);
      url = this.api_resource_url(resource);
      _fishpond = this.fishpond;
      _connection = this;
      data = post_data;
      if (!data) {
        data = {};
      }
      data.v = "1";
      data.k = _fishpond.api_key;
      if (this.fishpond.options['include_metadata']) {
        data.m = "1";
      }
      parameter_string = this.parameterize_data(data);
      full_request_url = "" + url + "?" + parameter_string;
      return this.connect(full_request_url, {}, function(response) {
        _fishpond.debug("Success");
        _fishpond.debug(response);
        _connection.current_requests -= 1;
        callback(response);
        return _connection.check_queue_and_process_next();
      });
    };

    Connection.prototype.check_queue_and_process_next = function() {
      var first_queue_item;
      if (this.current_requests < this.max_simultaneous_requests && this.request_queue.length > 0) {
        this.current_requests += 1;
        first_queue_item = this.request_queue.shift();
        return this.process_request(first_queue_item['resource'], first_queue_item['callback'], first_queue_item['data']);
      }
    };

    Connection.prototype.send_request = function(resource, callback, data) {
      this.request_queue.push({
        resource: resource,
        callback: callback,
        data: data
      });
      return this.check_queue_and_process_next();
    };

    Connection.prototype.connect = JSONP.get;

    return Connection;

  })();

  Fishpond.prototype.get_fish = function(fish_id, callback) {
    var fish, _fishpond;
    _fishpond = this;
    _fishpond.debug("Sending metadata request for fish " + fish_id);
    fish = this.pond.find_fish(fish_id);
    return fish.get_metadata(function(fish) {
      return callback(fish);
    });
  };

  Fishpond.prototype.log = function(msg) {
    return this.raw_log("[Fishpond] " + msg);
  };

  Fishpond.prototype.debug = function(msg) {
    if (this.options['debug'] === true) {
      return this.log(msg);
    }
  };

  Fishpond.prototype.raw_log = function(msg) {
    if (this.options['quiet'] !== true) {
      if (console && console.log) {
        return console.log(msg);
      }
    }
  };

  Fishpond.prototype.arrays_equal = function(a, b) {
    return a.length === b.length && a.every(function(elem, i) {
      return b.indexOf(elem) !== -1;
    });
  };

  Fishpond.prototype.array_unique = function(a) {
    var key, output, value, _i, _ref, _results;
    output = {};
    for (key = _i = 0, _ref = a.length; 0 <= _ref ? _i < _ref : _i > _ref; key = 0 <= _ref ? ++_i : --_i) {
      output[a[key]] = a[key];
    }
    _results = [];
    for (key in output) {
      value = output[key];
      _results.push(value);
    }
    return _results;
  };

  Fishpond.prototype.Pond = (function() {
    function Pond(fishpond) {
      this.fishpond = fishpond;
    }

    Pond.prototype.build = function(api_response) {
      var filter, tag, _i, _j, _len, _len1, _ref, _ref1, _results;
      this.id = api_response.id;
      this.name = api_response.name;
      this.fish_count = api_response.fish_count;
      this.tags = api_response.tags;
      this.filters = api_response.filters;
      this.tag_ids = {
        community: 'community'
      };
      this.filter_ids = {};
      this.fish = [];
      _ref = this.tags;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tag = _ref[_i];
        this.tag_ids[tag.slug] = tag.id;
      }
      _ref1 = this.filters;
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        filter = _ref1[_j];
        _results.push(this.filter_ids[filter.slug] = filter.id);
      }
      return _results;
    };

    Pond.prototype.toString = function() {
      return this.name;
    };

    Pond.prototype.load_all_fish = function(complete) {
      this.fishpond.debug("Loading " + this.fish_count + " fish");
      return this.load_fish(1, complete);
    };

    Pond.prototype.find_fish = function(fish_id) {
      var f, _i, _len, _ref;
      _ref = this.fish;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        f = _ref[_i];
        if (f.id === fish_id) {
          return f;
        }
      }
      return void 0;
    };

    Pond.prototype.default_query_tags = function() {
      var default_tags, tag, _i, _len, _ref;
      default_tags = {};
      _ref = this.tags;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tag = _ref[_i];
        default_tags[tag.id] = 10;
      }
      return default_tags;
    };

    Pond.prototype.slugged_tag_name = function(id) {
      var tag, _i, _len, _ref;
      _ref = this.tags;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tag = _ref[_i];
        if (tag.id === id) {
          return tag.slug;
        }
      }
    };

    Pond.prototype.humanized_tag_name = function(id) {
      var tag, _i, _len, _ref;
      _ref = this.tags;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tag = _ref[_i];
        if (tag.id === id) {
          return tag.name;
        }
      }
    };

    Pond.prototype.default_query_filters = function() {
      var default_filters, filter, _i, _len, _ref;
      default_filters = {};
      _ref = this.filters;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        filter = _ref[_i];
        default_filters[filter.id] = false;
      }
      return default_filters;
    };

    Pond.prototype.slugged_filter_name = function(id) {
      var filter, _i, _len, _ref;
      _ref = this.filters;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        filter = _ref[_i];
        if (filter.id === id) {
          return filter.slug;
        }
      }
    };

    Pond.prototype.humanized_filter_name = function(id) {
      var filter, _i, _len, _ref;
      _ref = this.filters;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        filter = _ref[_i];
        if (filter.id === id) {
          return filter.name;
        }
      }
    };

    Pond.prototype.is_filter = function(id) {
      var filter, _i, _len, _ref;
      _ref = this.filters;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        filter = _ref[_i];
        if (filter.id === id) {
          return true;
        }
      }
      return false;
    };

    Pond.prototype.is_tag = function(id) {
      var tag, _i, _len, _ref;
      _ref = this.tags;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tag = _ref[_i];
        if (tag.id === id) {
          return true;
        }
      }
      return false;
    };

    Pond.prototype.get_tag_by_name = function(name) {
      var tag, _i, _len, _ref;
      _ref = this.tags;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tag = _ref[_i];
        if (tag.name === name) {
          return tag;
        }
      }
      return false;
    };

    Pond.prototype.get_tag = function(id) {
      var tag, _i, _len, _ref;
      _ref = this.tags;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tag = _ref[_i];
        if (tag.id === id) {
          return tag;
        }
      }
      return false;
    };

    Pond.prototype.get_filter = function(id) {
      var filter, _i, _len, _ref;
      _ref = this.filters;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        filter = _ref[_i];
        if (filter.id === id) {
          return filter;
        }
      }
      return false;
    };

    Pond.prototype.load_fish = function(page, complete) {
      var handler, _fishpond, _pond;
      _pond = this;
      _fishpond = this.fishpond;
      handler = function(response) {
        var fish, fish_response, _i, _len;
        for (_i = 0, _len = response.length; _i < _len; _i++) {
          fish_response = response[_i];
          fish = new Fishpond.prototype.Fish(_pond);
          fish.build(fish_response);
          _pond.fish.push(fish);
        }
        _fishpond.trigger('loading', _pond.fish.length / _pond.fish_count);
        _fishpond.debug("Loaded " + _pond.fish.length + "/" + _pond.fish_count);
        if (response.length > 0) {
          return _pond.load_fish(page + 1, complete);
        } else {
          return complete();
        }
      };
      return _fishpond.connection.request(['ponds', this.id, "fish"], handler, {
        page: page
      });
    };

    return Pond;

  })();

  Fishpond.prototype.Fish = (function() {
    function Fish(pond) {
      this.pond = pond;
    }

    Fish.prototype.build = function(api_response) {
      this.id = api_response.id;
      this.title = api_response.title;
      this.tags = api_response.tags;
      this.community_tags = api_response.community_tags;
      this.humanized_tags = [];
      this.humanized_filters = [];
      this.is_cached = false;
      this.up_voted = false;
      this.metadata = {};
      this.humanize_tags();
      return this.ingest_metadata(api_response);
    };

    Fish.prototype.ingest_metadata = function(data) {
      var field, reserved_fields, value, _results;
      reserved_fields = ['id', 'title', 'tags', 'community_tags'];
      _results = [];
      for (field in data) {
        value = data[field];
        if (reserved_fields.indexOf(field) === -1) {
          this.metadata[field] = value;
          _results.push(this.is_cached = true);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Fish.prototype.humanize_tags = function() {
      var tag_id, value, _ref, _results;
      _ref = this.tags;
      _results = [];
      for (tag_id in _ref) {
        value = _ref[tag_id];
        if (this.pond.is_tag(tag_id)) {
          this.humanized_tags.push({
            name: this.pond.humanized_tag_name(tag_id),
            slug: this.pond.slugged_tag_name(tag_id),
            token: tag_id,
            value: parseInt(value, 10)
          });
        }
        if (this.pond.is_filter(tag_id)) {
          _results.push(this.humanized_filters.push({
            name: this.pond.humanized_filter_name(tag_id),
            slug: this.pond.slugged_filter_name(tag_id),
            token: tag_id,
            value: Boolean(parseInt(value, 10))
          }));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Fish.prototype.matches_filters = function(query_filters) {
      var filter, filter_groups, filter_id, filter_index, filtered, query_groups, value, _ref;
      filtered = true;
      filter_groups = [];
      query_groups = [];
      for (filter_id in query_filters) {
        value = query_filters[filter_id];
        if (Boolean(parseInt(value, 10))) {
          query_groups.push(this.pond.get_filter(filter_id).group);
        }
      }
      _ref = this.pond.filters;
      for (filter_index in _ref) {
        filter = _ref[filter_index];
        if (filter && query_filters[filter.id]) {
          if (Boolean(parseInt(this.tags[filter.id], 10)) && Boolean(parseInt(query_filters[filter.id], 10))) {
            filter_groups.push(filter.group);
          }
        }
      }
      query_groups = Fishpond.prototype.array_unique(query_groups);
      filter_groups = Fishpond.prototype.array_unique(filter_groups);
      if (query_groups.count === 0) {
        return false;
      }
      return Fishpond.prototype.arrays_equal(query_groups, filter_groups);
    };

    Fish.prototype.popularity = function() {
      return this.tags['popularity'];
    };

    Fish.prototype.calculate_score = function(query_tags) {
      var community_ratio, score, tag_id, value;
      score = 0;
      community_ratio = this.community_ratio(query_tags);
      for (tag_id in query_tags) {
        value = query_tags[tag_id];
        score += this.calculate_tag_score(tag_id, value, community_ratio);
      }
      return Math.round(score);
    };

    Fish.prototype.calculate_tag_score = function(tag_id, value, community_ratio) {
      var difference;
      value = parseInt(value, 10);
      if (value === false || this.tags[tag_id] === void 0) {
        return 0;
      } else {
        if (this.community_tags[tag_id] === void 0) {
          difference = this.tags[tag_id] - value;
        } else {
          difference = community_ratio * this.community_tags[tag_id] + (1 - community_ratio) * this.tags[tag_id] - value;
        }
        return difference * difference;
      }
    };

    Fish.prototype.community_ratio = function(query_tags) {
      var community_tag_value;
      community_tag_value = parseInt(query_tags['community'], 10);
      if (community_tag_value === void 0) {
        return 0;
      } else {
        return community_tag_value / 20.0;
      }
    };

    Fish.prototype.add_community_tags = function(community_humanized_tags, callback) {
      var community_tags, handler, tag_id, tag_slug, value, _fish;
      community_tags = {};
      _fish = this;
      handler = function(response) {
        return callback();
      };
      for (tag_slug in community_humanized_tags) {
        value = community_humanized_tags[tag_slug];
        tag_id = _fish.pond.tag_ids[tag_slug];
        community_tags[tag_id] = parseInt(value, 10);
      }
      return this.pond.fishpond.connection.request(['ponds', this.pond.id, 'fish', this.id, 'feedbacks'], handler, {
        community_feedback: community_tags
      });
    };

    Fish.prototype.up_vote = function() {
      var _fish;
      _fish = this;
      return this.pond.fishpond.connection.request(['ponds', this.pond.id, 'fish', this.id, 'up_vote'], function(response) {
        return _fish.up_voted = true;
      });
    };

    Fish.prototype.get_metadata = function(callback) {
      var _fish;
      if (this.is_cached) {
        return callback(this);
      } else {
        _fish = this;
        return this.pond.fishpond.connection.request(['ponds', this.pond.id, 'fish', this.id], function(response) {
          _fish.ingest_metadata(response);
          return callback(_fish);
        });
      }
    };

    return Fish;

  })();

  Fishpond.prototype.Result = (function() {
    function Result() {
      this.score = void 0;
      this.fish = void 0;
    }

    return Result;

  })();

  Fishpond.prototype.query = function(query_tags, query_filters) {
    var filter_id, filters, fish, index, query_filter_slug, query_filter_value, query_tag_slug, query_tag_value, result, results, tag_id, tags, _i, _j, _len, _len1, _ref, _ref1;
    this.debug("Querying " + this.pond);
    this.track(this.pond.name, "query", "tags:" + (JSON.stringify(query_tags)) + ", filters:" + (JSON.stringify(query_filters)), this.time_alive());
    tags = this.pond.default_query_tags();
    filters = this.pond.default_query_filters();
    for (query_tag_slug in query_tags) {
      query_tag_value = query_tags[query_tag_slug];
      tag_id = this.pond.tag_ids[query_tag_slug];
      if (tag_id !== void 0) {
        if (query_tag_value === false) {
          tags[tag_id] = false;
        } else {
          tags[tag_id] = parseInt(query_tag_value);
        }
      }
    }
    for (query_filter_slug in query_filters) {
      query_filter_value = query_filters[query_filter_slug];
      filter_id = this.pond.filter_ids[query_filter_slug];
      if (filter_id !== void 0) {
        filters[filter_id] = parseInt(query_filter_value);
      }
    }
    results = [];
    _ref = this.pond.fish;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      fish = _ref[_i];
      if (fish.matches_filters(filters)) {
        result = new Fishpond.prototype.Result;
        result.score = fish.calculate_score(tags);
        result.fish = fish;
        results.push(result);
      }
    }
    results.sort(function(result1, result2) {
      if (result1.score === result2.score) {
        return 0;
      }
      if (result1.score > result2.score) {
        return 1;
      }
      if (result1.score < result2.score) {
        return -1;
      }
    });
    if (this.event_tracking_enabled) {
      index = 1;
      _ref1 = results.slice(0, 30);
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        result = _ref1[_j];
        this.track(result.fish.title, "ranked", "", index);
        index += 1;
      }
    }
    this.trigger('resultsUpdated', results.slice(0, 30));
    return true;
  };

  Fishpond.prototype.search = function(string) {
    var fish, result, results, _i, _len, _ref;
    this.debug("Searching for titles like " + string + " in " + this.pond);
    this.track(this.pond.name, "search", string, this.time_alive());
    results = [];
    _ref = this.pond.fish;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      fish = _ref[_i];
      result = new Fishpond.prototype.Result;
      result.score = fish.title.score(string);
      result.fish = fish;
      if (result.score > 0) {
        results.push(result);
      }
    }
    results.sort(function(result1, result2) {
      if (result1.score === result2.score) {
        return 0;
      }
      if (result1.score < result2.score) {
        return 1;
      }
      if (result1.score > result2.score) {
        return -1;
      }
    });
    return results.slice(0, 5);
  };


  /*!
   * string_score.js: Quicksilver-like string scoring algorithm.
   *
   * Copyright (C) 2009-2011 Joshaven Potter <yourtech@gmail.com>
   * Copyright (C) 2010-2011 Yesudeep Mangalapilly <yesudeep@gmail.com>
   * MIT license: http://www.opensource.org/licenses/mit-license.php
   */

  String.prototype.score = function(abbreviation) {
    var abbreviation_length, abbreviation_score, c, character_score, final_score, i, index_c_lowercase, index_c_uppercase, index_in_string, min_index, should_award_common_prefix_bonus, string, string_length, total_character_score, _i, _len;
    string = this;
    if (string === abbreviation) {
      return 1.0;
    }
    string_length = string.length;
    total_character_score = 0;
    should_award_common_prefix_bonus = 0;
    for (i = _i = 0, _len = abbreviation.length; _i < _len; i = ++_i) {
      c = abbreviation[i];
      index_c_lowercase = string.indexOf(c.toLowerCase());
      index_c_uppercase = string.indexOf(c.toUpperCase());
      min_index = Math.min(index_c_lowercase, index_c_uppercase);
      index_in_string = min_index > -1 ? min_index : Math.max(index_c_lowercase, index_c_uppercase);
      if (index_in_string === -1) {
        return 0;
      }
      character_score = 0.1;
      if (string[index_in_string] === c) {
        character_score += 0.1;
      }
      if (index_in_string === 0) {
        character_score += 0.8;
        if (i === 0) {
          should_award_common_prefix_bonus = 1;
        }
      }
      if (string.charAt(index_in_string - 1) === ' ') {
        character_score += 0.8;
      }
      string = string.substring(index_in_string + 1, string_length);
      total_character_score += character_score;
    }
    abbreviation_length = abbreviation.length;
    abbreviation_score = total_character_score / abbreviation_length;
    final_score = ((abbreviation_score * (abbreviation_length / string_length)) + abbreviation_score) / 2;
    if (should_award_common_prefix_bonus && (final_score + 0.1 < 1)) {
      final_score += 0.1;
    }
    return final_score;
  };

}).call(this);
