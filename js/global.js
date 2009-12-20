$(function () {
	
	function truncate (text, num)
	{
		if (text.length > num) {
			return text.substr(0, num) + "...";
		}
		return text;
	}
	
	function link (text, url, trun)
	{
		return '<a href="' + url + '" target="_blank" title="' + text + '">' + ((typeof trun === "boolean" && trun) ? truncate(text, 30) : text) + '</a>';
	}
	
	function p (count) {
		return (count ? 's' : '');
	}
		
	var settings = {
		'api': 'http://ws.audioscrobbler.com/2.0/?method=[[method]]&user=[[user]]&api_key=b25b959554ed76058ac220b7b2e0a026&format=json[[extra]]',
		'methods': {
			'recenttracks': {
				'title': 'Recent Tracks',
				'method': 'user.getrecenttracks',
				'looper': 'track',
				'format': function (item) {
					return link(item.artist['#text'] + ' - ' + item.name, item.url);
				},
				'formatRight': function (item) {
					if (item.date)
					{
						return item.date['#text'];
					}
					else if (item['@attr'] && item['@attr'].nowplaying)
					{
						return 'Now playing';
					}
				}
			},
			'topartists': {
				'title': 'Top Artists',
				'method': 'user.getTopArtists',
				'looper': 'artist',
				'extra': 'period=3month',
				'limit': 10,
				'format': function (item) {
					return link(item.name, item.url);
				},
				'formatRight': function (item) {
					return item.playcount + ' play' + p(item.playcount);
				}
			},
			'toptracks': {
				'title': 'Top Tracks',
				'method': 'user.getTopTracks',
				'looper': 'track',
				'extra': 'period=3month',
				'limit': 10,
				'format': function (item) {
					return link(item.name, item.url, true) + ' by ' + link(item.artist.name, item.artist.url);
				},
				'formatRight': function (item) {
					return item.playcount + ' play' + p(item.playcount);
				}
			},
			'topalbums': {
				'title': 'Top Albums',
				'method': 'user.getTopAlbums',
				'looper': 'album',
				'extra': 'period=3month',
				'limit': 10,
				'format': function (item) {
					return link(item.name, item.url, true) + ' by ' + link(item.artist.name, item.artist.url);
				},
				'formatRight': function (item) {
					return item.playcount + ' play' + p(item.playcount);
				}
			},
			'lovedtracks': {
				'title': 'Loved Tracks',
				'method': 'user.getLovedTracks',
				'looper': 'track',
				'extra': 'limit=10',
				'format': function (item) {
					return link(item.name, item.url, true) + ' by ' + link(item.artist.name, item.artist.url);
				},
				'formatRight': function (item) {
					return item.date['#text'];
				}
			},
			'events': {
				'title': 'Events',
				'method': 'user.getEvents',
				'looper': 'event',
				'format': function (item) {
					var str = '';
					str += link(item.title, item.url) + ' at ' + link(item.venue.name, item.venue.url);
					return str;
				},
				'formatRight': function (item) {
					var d = item.startDate;
					var reg = d.match(/([a-z]{3}), (\d{2}) ([a-z]{3})/ig)
					if (reg && reg[0]) {
						return reg[0].replace(',', '');
					}
					return d;
				}
			}
		}
	};
	
	var querystring = (function () {
		var obj = {};
		var query = window.location.search.substring(1);
		if (query != "") {
			var vars = query.split("&"); 
			for (var i = 0; i < vars.length; i++) {
				var p = vars[i].split("=");
				obj[p[0]] = p[1];
			}
		}
		
		if (window.location.hash !== "") obj['#'] = window.location.hash.replace('#', '');
		
		return obj;
	})();
	
	
	var Panel = function (key, method) {
		this.key = key;
		this.method = method;
		this.url = settings.api.replace('[[method]]', this.method.method).replace('[[user]]', querystring.user).replace('[[extra]]', ((typeof this.method.extra === "string") ? '&' + this.method.extra : ''));
		
		this.limits = function () {
			if (typeof this.method.limit === "number")
			{
				this.jq.find('li').slice(this.method.limit).hide();
				this.jq.append('<li class="more"><a href="#">More &raquo;</a></li>');
			}
		};
		
		this.success = function (data) {
			
			var str = '';
			
			for (j in data[this.key][this.method.looper])
			{
				var obj = data[this.key][this.method.looper][j];
						
				str += '<li>';
				str += this.method.format(obj);
					
				if (typeof this.method.formatRight === "function")
				{
					str += '<div class="side">';
					str += this.method.formatRight(obj); 
					str += '</div>';
				}
				str += '</li>';
			}
			
			this.jq.empty().append(str);
			this.limits();
		};
		
		this.error = function () {
			this.jq.html('<li>Error getting data feed :(</li>');
		}
		
		this.get = function () {
			(function (e) {
				$.ajax({
					'url': e.url,
					'dataType': 'jsonp',
					'success': function (data) {
						try {
							e.success(data);
						} catch (err) {
							e.error();
						}
						$('#article').show();
						$('#loading').hide();
						
					},
					'error': function () {
						e.error();
						$('#article').show();
						$('#loading').hide();
						
					}
				});
			})(this);
		};
		
		this.build = function () {
			$('#article').append('<div class="set"><div class="ctr"><h3>' + this.method.title + '</h3><ul id="' + this.key + '"></ul></div></div>');
			this.jq = $('#' + this.key);
		};
		
		this.init = function () {
			this.build();
			this.get();
		};
		
		this.init();
	};
	
	if (querystring.user)
	{
		$('#loading').show();
		$('#intro').hide(); 
		
		for (i in settings.methods)
		{
			var panel = new Panel(i, settings.methods[i]);
			
		}
	}
	
	$('form input[type="text"]').val(querystring.user).focus(function () {
		if ($(this).val() == querystring.user) $(this).val('');
	}).blur(function () {
		if ($(this).val() == '') $(this).val(querystring.user);
	});
	
	$('li.more a').live('click', function () {
		$(this).parent().parent().find('li').show().filter('.more').hide();
		return false;
	});
	
	
});