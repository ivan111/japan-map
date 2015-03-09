(function() {
  var svg;

  //save off default references
  var d3 = window.d3, topojson = window.topojson;

  var defaultOptions = {
    scope: 'world',
    setProjection: setProjection,
    projection: 'equirectangular',
    dataType: 'json',
    done: function() {},
    fills: {
      defaultFill: '#ABDDA4'
    },
    geographyConfig: {
        dataUrl: null,
        hideAntarctica: true,
        borderWidth: 1,
        borderColor: '#FDFDFD',
        popupTemplate: function(geography, data) {
            return '<div class="hoverinfo"><strong>' + geography.properties.name_local + '</strong></div>';
        },
        popupOnHover: true,
        highlightOnHover: true,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2
    },
    projectionConfig: {
      rotation: [97, 0]
    },
    bubblesConfig: {
        borderWidth: 2,
        borderColor: '#FFFFFF',
        popupOnHover: true,
        popupTemplate: function(geography, data) {
            return '<div class="hoverinfo"><strong>' + data.name_local + '</strong></div>';
        },
        fillOpacity: 0.75,
        animate: true,
        highlightOnHover: true,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2,
        highlightFillOpacity: 0.85,
        exitDelay: 100
    },
    arcConfig: {
      strokeColor: '#DD1C77',
      strokeWidth: 1,
      arcSharpness: 1,
      animationSpeed: 600
    }
  };

  function addContainer( element, height, width ) {
    this.svg = d3.select( element ).append('svg')
      .attr('width', width || element.offsetWidth)
      .attr('class', 'datamap')
      .attr('height', height || element.offsetHeight)
      .style('overflow', 'hidden'); // IE10+ doesn't respect height/width when map is zoomed in

    return this.svg;
  }

  // setProjection takes the svg element and options
  function setProjection( element, options ) {
    var width = options.width || element.offsetWidth;
    var height = options.height || element.offsetHeight;
    var projection, path;
    var svg = this.svg;

    if ( options && typeof options.scope === 'undefined') {
      options.scope = 'world';
    }

    if ( options.scope === 'japan' ) {
      projection = d3.geo.mercator()
        .center([137, 36])
        .translate([width / 2, height / 2])
        .scale(width*1.8);
    }
    else if ( options.scope === 'world' ) {
      projection = d3.geo[options.projection]()
        .scale((width + 1) / 2 / Math.PI)
        .translate([width / 2, height / (options.projection === "mercator" ? 1.45 : 1.8)]);
    }

    if ( options.projection === 'orthographic' ) {

      svg.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

      svg.append("use")
          .attr("class", "stroke")
          .attr("xlink:href", "#sphere");

      svg.append("use")
          .attr("class", "fill")
          .attr("xlink:href", "#sphere");
      projection.scale(250).clipAngle(90).rotate(options.projectionConfig.rotation)
    }

    path = d3.geo.path()
      .projection( projection );

    return {path: path, projection: projection};
  }

  function addStyleBlock() {
    if ( d3.select('.datamaps-style-block').empty() ) {
      d3.select('head').append('style').attr('class', 'datamaps-style-block')
      .html('.datamap path.datamaps-graticule { fill: none; stroke: #777; stroke-width: 0.5px; stroke-opacity: .5; pointer-events: none; } .datamap .labels {pointer-events: none;} .datamap path {stroke: #FFFFFF; stroke-width: 1px;} .datamaps-legend dt, .datamaps-legend dd { float: left; margin: 0 3px 0 0;} .datamaps-legend dd {width: 20px; margin-right: 6px; border-radius: 3px;} .datamaps-legend {padding-bottom: 20px; z-index: 1001; position: absolute; left: 4px; font-size: 12px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;} .datamaps-hoverover {display: none; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; } .hoverinfo {padding: 4px; border-radius: 1px; background-color: #FFF; box-shadow: 1px 1px 5px #CCC; font-size: 12px; border: 1px solid #CCC; } .hoverinfo hr {border:1px dotted #CCC; }');
    }
  }

  function drawSubunits( data ) {
    var fillData = this.options.fills,
        colorCodeData = this.options.data || {},
        geoConfig = this.options.geographyConfig;


    var subunits = this.svg.select('g.datamaps-subunits');
    if ( subunits.empty() ) {
      subunits = this.addLayer('datamaps-subunits', null, true);
    }

    var geoData = topojson.feature( data, data.objects[ this.options.scope ] ).features;
    if ( geoConfig.hideAntarctica ) {
      geoData = geoData.filter(function(feature) {
        return feature.id !== "ATA";
      });
    }

    var geo = subunits.selectAll('path.datamaps-subunit').data( geoData );

    geo.enter()
      .append('path')
      .attr('d', this.path)
      .attr('class', function(d) {
        return 'datamaps-subunit ' + d.id;
      })
      .attr('data-info', function(d) {
        return JSON.stringify( colorCodeData[d.id]);
      })
      .style('fill', function(d) {
        var fillColor;

        if ( colorCodeData[d.id] ) {
          fillColor = fillData[ colorCodeData[d.id].fillKey ];
        }

        return fillColor || fillData.defaultFill;
      })
      .style('stroke-width', geoConfig.borderWidth)
      .style('stroke', geoConfig.borderColor);
  }

  function handleGeographyConfig () {
    var hoverover;
    var svg = this.svg;
    var self = this;
    var options = this.options.geographyConfig;

    if ( options.highlightOnHover || options.popupOnHover ) {
      svg.selectAll('.datamaps-subunit')
        .on('mouseover', function(d) {
          var $this = d3.select(this);

          if ( options.highlightOnHover ) {
            var previousAttributes = {
              'fill':  $this.style('fill'),
              'stroke': $this.style('stroke'),
              'stroke-width': $this.style('stroke-width'),
              'fill-opacity': $this.style('fill-opacity')
            };

            $this
              .style('fill', options.highlightFillColor)
              .style('stroke', options.highlightBorderColor)
              .style('stroke-width', options.highlightBorderWidth)
              .style('fill-opacity', options.highlightFillOpacity)
              .attr('data-previousAttributes', JSON.stringify(previousAttributes));

            //as per discussion on https://github.com/markmarkoh/datamaps/issues/19
            if ( ! /((MSIE)|(Trident))/.test ) {
             moveToFront.call(this);
            }
          }

          if ( options.popupOnHover ) {
            self.updatePopup($this, d, options, svg);
          }
        })
        .on('mouseout', function() {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            //reapply previous attributes
            var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
            for ( var attr in previousAttributes ) {
              $this.style(attr, previousAttributes[attr]);
            }
          }
          $this.on('mousemove', null);
          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        });
    }

    function moveToFront() {
      this.parentNode.appendChild(this);
    }
  }

  //plugin to add a simple map legend
  function addLegend(layer, data, options) {
    data = data || {};
    if ( !this.options.fills ) {
      return;
    }

    var html = '<dl>';
    var label = '';
    if ( data.legendTitle ) {
      html = '<h2>' + data.legendTitle + '</h2>' + html;
    }
    for ( var fillKey in this.options.fills ) {

      if ( fillKey === 'defaultFill') {
        if (! data.defaultFillName ) {
          continue;
        }
        label = data.defaultFillName;
      } else {
        if (data.labels && data.labels[fillKey]) {
          label = data.labels[fillKey];
        } else {
          label= fillKey + ': ';
        }
      }
      html += '<dt>' + label + '</dt>';
      html += '<dd style="background-color:' +  this.options.fills[fillKey] + '">&nbsp;</dd>';
    }
    html += '</dl>';

    var hoverover = d3.select( this.options.element ).append('div')
      .attr('class', 'datamaps-legend')
      .html(html);
  }

    function addGraticule ( layer, options ) {
      var graticule = d3.geo.graticule();
      this.svg.insert("path", '.datamaps-subunits')
        .datum(graticule)
        .attr("class", "datamaps-graticule")
        .attr("d", this.path);
  }

  function handleArcs (layer, data, options) {
    var self = this,
        svg = this.svg;

    if ( !data || (data && !data.slice) ) {
      throw "Datamaps Error - arcs must be an array";
    }

    if ( typeof options === "undefined" ) {
      options = defaultOptions.arcConfig;
    }

    var arcs = layer.selectAll('path.datamaps-arc').data( data, JSON.stringify );

    arcs
      .enter()
        .append('svg:path')
        .attr('class', 'datamaps-arc')
        .style('stroke-linecap', 'round')
        .style('stroke', function(datum) {
          if ( datum.options && datum.options.strokeColor) {
            return datum.options.strokeColor;
          }
          return  options.strokeColor
        })
        .style('fill', 'none')
        .style('stroke-width', function(datum) {
          if ( datum.options && datum.options.strokeWidth) {
            return datum.options.strokeWidth;
          }
          return options.strokeWidth;
        })
        .attr('d', function(datum) {
            var originXY = self.latLngToXY(datum.origin.latitude, datum.origin.longitude);
            var destXY = self.latLngToXY(datum.destination.latitude, datum.destination.longitude);
            var midXY = [ (originXY[0] + destXY[0]) / 2, (originXY[1] + destXY[1]) / 2];
            return "M" + originXY[0] + ',' + originXY[1] + "S" + (midXY[0] + (50 * options.arcSharpness)) + "," + (midXY[1] - (75 * options.arcSharpness)) + "," + destXY[0] + "," + destXY[1];
        })
        .transition()
          .delay(100)
          .style('fill', function() {
            /*
              Thank you Jake Archibald, this is awesome.
              Source: http://jakearchibald.com/2013/animated-line-drawing-svg/
            */
            var length = this.getTotalLength();
            this.style.transition = this.style.WebkitTransition = 'none';
            this.style.strokeDasharray = length + ' ' + length;
            this.style.strokeDashoffset = length;
            this.getBoundingClientRect();
            this.style.transition = this.style.WebkitTransition = 'stroke-dashoffset ' + options.animationSpeed + 'ms ease-out';
            this.style.strokeDashoffset = '0';
            return 'none';
          })

    arcs.exit()
      .transition()
      .style('opacity', 0)
      .remove();
  }

  function handleLabels ( layer, options ) {
    var self = this;
    options = options || {};
    this.svg.selectAll(".datamaps-subunit")
      .attr("data-foo", function(d) {
        var center = self.path.centroid(d),
            x,y;

        x = center[0] - 15;
        y = center[1];

        layer.append("text")
          .attr("x", x)
          .attr("y", y)
          .style("font-size", (options.fontSize || 10) + 'px')
          .style("font-family", options.fontFamily || "Verdana")
          .style("fill", options.labelColor || "#000")
          .text( d.properties.name_local );
        return "bar";
      });
  }


  function handleBubbles (layer, data, options ) {
    var self = this,
        fillData = this.options.fills,
        svg = this.svg;

    if ( !data || (data && !data.slice) ) {
      throw "Datamaps Error - bubbles must be an array";
    }

    var bubbles = layer.selectAll('circle.datamaps-bubble').data( data, JSON.stringify );

    bubbles
      .enter()
        .append('svg:circle')
        .attr('class', 'datamaps-bubble')
        .attr('cx', function ( datum ) {
          var latLng;
          if ( datumHasCoords(datum) ) {
            latLng = self.latLngToXY(datum.latitude, datum.longitude);
          }
          else if ( datum.centered ) {
            latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
          }
          if ( latLng ) return latLng[0];
        })
        .attr('cy', function ( datum ) {
          var latLng;
          if ( datumHasCoords(datum) ) {
            latLng = self.latLngToXY(datum.latitude, datum.longitude);
          }
          else if ( datum.centered ) {
            latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
          }
          if ( latLng ) return latLng[1];;
        })
        .attr('r', 0) //for animation purposes
        .attr('data-info', function(d) {
          return JSON.stringify(d);
        })
        .style('stroke', function ( datum ) {
          return typeof datum.borderColor !== 'undefined' ? datum.borderColor : options.borderColor;
        })
        .style('stroke-width', function ( datum ) {
          return typeof datum.borderWidth !== 'undefined' ? datum.borderWidth : options.borderWidth;
        })
        .style('fill-opacity', function ( datum ) {
          return typeof datum.fillOpacity !== 'undefined' ? datum.fillOpacity : options.fillOpacity;
        })
        .style('fill', function ( datum ) {
          var fillColor = fillData[ datum.fillKey ];
          return fillColor || fillData.defaultFill;
        })
        .on('mouseover', function ( datum ) {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            //save all previous attributes for mouseout
            var previousAttributes = {
              'fill':  $this.style('fill'),
              'stroke': $this.style('stroke'),
              'stroke-width': $this.style('stroke-width'),
              'fill-opacity': $this.style('fill-opacity')
            };

            $this
              .style('fill', options.highlightFillColor)
              .style('stroke', options.highlightBorderColor)
              .style('stroke-width', options.highlightBorderWidth)
              .style('fill-opacity', options.highlightFillOpacity)
              .attr('data-previousAttributes', JSON.stringify(previousAttributes));
          }

          if (options.popupOnHover) {
            self.updatePopup($this, datum, options, svg);
          }
        })
        .on('mouseout', function ( datum ) {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            //reapply previous attributes
            var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
            for ( var attr in previousAttributes ) {
              $this.style(attr, previousAttributes[attr]);
            }
          }

          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        })
        .transition().duration(400)
          .attr('r', function ( datum ) {
            return datum.radius;
          });

    bubbles.exit()
      .transition()
        .delay(options.exitDelay)
        .attr("r", 0)
        .remove();

    function datumHasCoords (datum) {
      return typeof datum !== 'undefined' && typeof datum.latitude !== 'undefined' && typeof datum.longitude !== 'undefined';
    }

  }

  //stolen from underscore.js
  function defaults(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  }
  /**************************************
             Public Functions
  ***************************************/

  function Datamap( options ) {

    if ( typeof d3 === 'undefined' || typeof topojson === 'undefined' ) {
      throw new Error('Include d3.js (v3.0.3 or greater) and topojson on this page before creating a new map');
   }

    //set options for global use
    this.options = defaults(options, defaultOptions);
    this.options.geographyConfig = defaults(options.geographyConfig, defaultOptions.geographyConfig);
    this.options.projectionConfig = defaults(options.projectionConfig, defaultOptions.projectionConfig);
    this.options.bubblesConfig = defaults(options.bubblesConfig, defaultOptions.bubblesConfig);
    this.options.arcConfig = defaults(options.arcConfig, defaultOptions.arcConfig);

    //add the SVG container
    if ( d3.select( this.options.element ).select('svg').length > 0 ) {
      addContainer.call(this, this.options.element, this.options.height, this.options.width );
    }

    /* Add core plugins to this instance */
    this.addPlugin('bubbles', handleBubbles);
    this.addPlugin('legend', addLegend);
    this.addPlugin('arc', handleArcs);
    this.addPlugin('labels', handleLabels);
    this.addPlugin('graticule', addGraticule);

    //append style block with basic hoverover styles
    if ( ! this.options.disableDefaultStyles ) {
      addStyleBlock();
    }

    return this.draw();
  }

  // actually draw the features(states & countries)
  Datamap.prototype.draw = function() {
    //save off in a closure
    var self = this;
    var options = self.options;

    //set projections and paths based on scope
    var pathAndProjection = options.setProjection.apply(self, [options.element, options] );

    this.path = pathAndProjection.path;
    this.projection = pathAndProjection.projection;

    //if custom URL for topojson data, retrieve it and render
    if ( options.geographyConfig.dataUrl ) {
      d3.json( options.geographyConfig.dataUrl, function(error, results) {
        if ( error ) throw new Error(error);
        self.customTopo = results;
        draw( results );
      });
    }
    else {
      draw( this[options.scope + 'Topo'] || options.geographyConfig.dataJson);
    }

    return this;

      function draw (data) {
        // if fetching remote data, draw the map first then call `updateChoropleth`
        if ( self.options.dataUrl ) {
          //allow for csv or json data types
          d3[self.options.dataType](self.options.dataUrl, function(data) {
            //in the case of csv, transform data to object
            if ( self.options.dataType === 'csv' && (data && data.slice) ) {
              var tmpData = {};
              for(var i = 0; i < data.length; i++) {
                tmpData[data[i].id] = data[i];
              }
              data = tmpData;
            }
            Datamaps.prototype.updateChoropleth.call(self, data);
          });
        }
        drawSubunits.call(self, data);
        handleGeographyConfig.call(self);

        if ( self.options.geographyConfig.popupOnHover || self.options.bubblesConfig.popupOnHover) {
          hoverover = d3.select( self.options.element ).append('div')
            .attr('class', 'datamaps-hoverover')
            .style('z-index', 10001)
            .style('position', 'absolute');
        }

        //fire off finished callback
        self.options.done(self);
      }
  };
  /**************************************
                TopoJSON
  ***************************************/
  Datamap.prototype.worldTopo = '__WORLD__';
  Datamap.prototype.japanTopo = {"type":"Topology","transform":{"scale":[0.001738740161173309,0.0015486138035812238],"translate":[123.00336780940371,24.04123760715904]},"objects":{"japan":{"type":"GeometryCollection","geometries":[{"arcs":[[[0]],[[1]]],"type":"MultiPolygon","properties":{"iso_3166_2":"JP-01","name":"Hokkaido","name_local":"北海道","latitude":43.37,"longitude":142.805}},{"arcs":[[2,3,4]],"type":"Polygon","properties":{"iso_3166_2":"JP-02","name":"Aomori","name_local":"青森県","latitude":40.6385,"longitude":140.769}},{"arcs":[[5,6,-3,7]],"type":"Polygon","properties":{"iso_3166_2":"JP-03","name":"Iwate","name_local":"岩手県","latitude":39.5715,"longitude":141.364}},{"arcs":[[8,9,10,-6,11]],"type":"Polygon","properties":{"iso_3166_2":"JP-04","name":"Miyagi","name_local":"宮城県","latitude":38.5307,"longitude":140.972}},{"arcs":[[-7,-11,12,13,-4]],"type":"Polygon","properties":{"iso_3166_2":"JP-05","name":"Akita","name_local":"秋田県","latitude":39.7318,"longitude":140.334}},{"arcs":[[-10,14,15,16,-13]],"type":"Polygon","properties":{"iso_3166_2":"JP-06","name":"Yamagata","name_local":"山形県","latitude":38.4024,"longitude":140.084}},{"arcs":[[17,18,19,20,21,-15,-9]],"type":"Polygon","properties":{"iso_3166_2":"JP-07","name":"Fukushima","name_local":"福島県","latitude":37.4153,"longitude":140.099}},{"arcs":[[22,23,24,25,26,-19]],"type":"Polygon","properties":{"iso_3166_2":"JP-08","name":"Ibaraki","name_local":"茨城県","latitude":36.2773,"longitude":140.257}},{"arcs":[[-27,27,-20]],"type":"Polygon","properties":{"iso_3166_2":"JP-09","name":"Tochigi","name_local":"栃木県","latitude":36.6593,"longitude":139.786}},{"arcs":[[-21,-28,-26,28,29,30]],"type":"Polygon","properties":{"iso_3166_2":"JP-10","name":"Gunma","name_local":"群馬県","latitude":36.5592,"longitude":139.025}},{"arcs":[[-25,31,32,33,34,-29]],"type":"Polygon","properties":{"iso_3166_2":"JP-11","name":"Saitama","name_local":"埼玉県","latitude":36.0173,"longitude":139.287}},{"arcs":[[35,36,-32,-24]],"type":"Polygon","properties":{"iso_3166_2":"JP-12","name":"Chiba","name_local":"千葉県","latitude":35.489,"longitude":140.318}},{"arcs":[[-37,37,38,39,-33]],"type":"Polygon","properties":{"iso_3166_2":"JP-13","name":"Tokyo","name_local":"東京都","latitude":35.6578,"longitude":139.407}},{"arcs":[[40,41,42,-39]],"type":"Polygon","properties":{"iso_3166_2":"JP-14","name":"Kanagawa","name_local":"神奈川県","latitude":35.4378,"longitude":139.344}},{"arcs":[[[43]],[[-22,-31,44,45,46,-16]]],"type":"MultiPolygon","properties":{"iso_3166_2":"JP-15","name":"Niigata","name_local":"新潟県","latitude":37.5471,"longitude":139.005}},{"arcs":[[47,48,49,50,-46]],"type":"Polygon","properties":{"iso_3166_2":"JP-16","name":"Toyama","name_local":"富山県","latitude":36.596,"longitude":137.246}},{"arcs":[[-50,51,52,53]],"type":"Polygon","properties":{"iso_3166_2":"JP-17","name":"Ishikawa","name_local":"石川県","latitude":36.5654,"longitude":136.677}},{"arcs":[[54,55,56,57,-53]],"type":"Polygon","properties":{"iso_3166_2":"JP-18","name":"Fukui","name_local":"福井県","latitude":35.9297,"longitude":136.316}},{"arcs":[[-34,-40,-43,58,59]],"type":"Polygon","properties":{"iso_3166_2":"JP-19","name":"Yamanashi","name_local":"山梨県","latitude":35.6149,"longitude":138.645}},{"arcs":[[-30,-35,-60,60,61,62,-48,-45]],"type":"Polygon","properties":{"iso_3166_2":"JP-20","name":"Nagano","name_local":"長野県","latitude":36.0666,"longitude":138.019}},{"arcs":[[-63,63,64,65,-55,-52,-49]],"type":"Polygon","properties":{"iso_3166_2":"JP-21","name":"Gifu","name_local":"岐阜県","latitude":35.8522,"longitude":136.941}},{"arcs":[[-42,66,67,-61,-59]],"type":"Polygon","properties":{"iso_3166_2":"JP-22","name":"Shizuoka","name_local":"静岡県","latitude":35.0359,"longitude":138.306}},{"arcs":[[-62,-68,68,69,-64]],"type":"Polygon","properties":{"iso_3166_2":"JP-23","name":"Aichi","name_local":"愛知県","latitude":34.9973,"longitude":137.214}},{"arcs":[[70,71,72,73,74,-65,-70]],"type":"Polygon","properties":{"iso_3166_2":"JP-24","name":"Mie","name_local":"三重県","latitude":34.5679,"longitude":136.386}},{"arcs":[[-66,-75,75,-56]],"type":"Polygon","properties":{"iso_3166_2":"JP-25","name":"Shiga","name_local":"滋賀県","latitude":35.1832,"longitude":136.093}},{"arcs":[[-57,-76,-74,76,77,78,79]],"type":"Polygon","properties":{"iso_3166_2":"JP-26","name":"Kyoto","name_local":"京都府","latitude":35.2117,"longitude":135.451}},{"arcs":[[80,81,82,83,-78]],"type":"Polygon","properties":{"iso_3166_2":"JP-27","name":"Osaka","name_local":"大阪府","latitude":34.5993,"longitude":135.519}},{"arcs":[[[84]],[[-79,-84,85,86,87,88]]],"type":"MultiPolygon","properties":{"iso_3166_2":"JP-28","name":"Hyōgo","name_local":"兵庫県","latitude":35.063,"longitude":134.837}},{"arcs":[[-73,89,-81,-77]],"type":"Polygon","properties":{"iso_3166_2":"JP-29","name":"Nara","name_local":"奈良県","latitude":34.2815,"longitude":135.877}},{"arcs":[[-90,-72,90,-82]],"type":"Polygon","properties":{"iso_3166_2":"JP-30","name":"Wakayama","name_local":"和歌山県","latitude":33.93,"longitude":135.401}},{"arcs":[[91,92,93,94,-88]],"type":"Polygon","properties":{"iso_3166_2":"JP-31","name":"Tottori","name_local":"鳥取県","latitude":35.3657,"longitude":133.819}},{"arcs":[[[-94,95,96,97]],[[98]]],"type":"MultiPolygon","properties":{"iso_3166_2":"JP-32","name":"Shimane","name_local":"島根県","latitude":35.0972,"longitude":132.603}},{"arcs":[[-87,99,100,-92]],"type":"Polygon","properties":{"iso_3166_2":"JP-33","name":"Okayama","name_local":"岡山県","latitude":34.8521,"longitude":133.831}},{"arcs":[[-93,-101,101,102,-96]],"type":"Polygon","properties":{"iso_3166_2":"JP-34","name":"Hiroshima","name_local":"広島県","latitude":34.6067,"longitude":132.853}},{"arcs":[[-103,103,-97]],"type":"Polygon","properties":{"iso_3166_2":"JP-35","name":"Yamaguchi","name_local":"山口県","latitude":34.2154,"longitude":131.645}},{"arcs":[[104,105,106,107]],"type":"Polygon","properties":{"iso_3166_2":"JP-36","name":"Tokushima","name_local":"徳島県","latitude":33.8546,"longitude":134.2}},{"arcs":[[-107,108,109]],"type":"Polygon","properties":{"iso_3166_2":"JP-37","name":"Kagawa","name_local":"香川県","latitude":34.2162,"longitude":134.001}},{"arcs":[[-109,-106,110,111]],"type":"Polygon","properties":{"iso_3166_2":"JP-38","name":"Ehime","name_local":"愛媛県","latitude":33.8141,"longitude":132.916}},{"arcs":[[112,-111,-105]],"type":"Polygon","properties":{"iso_3166_2":"JP-39","name":"Kochi","name_local":"高知県","latitude":33.6129,"longitude":133.442}},{"arcs":[[113,114,115,116,117]],"type":"Polygon","properties":{"iso_3166_2":"JP-40","name":"Fukuoka","name_local":"福岡県","latitude":33.4906,"longitude":130.616}},{"arcs":[[-117,118,119,120]],"type":"Polygon","properties":{"iso_3166_2":"JP-41","name":"Saga","name_local":"佐賀県","latitude":33.0097,"longitude":130.147}},{"arcs":[[[121]],[[-120,122]],[[123]],[[124]],[[125]],[[126]]],"type":"MultiPolygon","properties":{"iso_3166_2":"JP-42","name":"Nagasaki","name_local":"長崎県","latitude":32.6745,"longitude":128.755}},{"arcs":[[[127]],[[128,129,130,-115,131]]],"type":"MultiPolygon","properties":{"iso_3166_2":"JP-43","name":"Kumamoto","name_local":"熊本県","latitude":32.588,"longitude":130.834}},{"arcs":[[132,-132,-114,133]],"type":"Polygon","properties":{"iso_3166_2":"JP-44","name":"Oita","name_local":"大分県","latitude":33.2006,"longitude":131.449}},{"arcs":[[134,135,-129,-133]],"type":"Polygon","properties":{"iso_3166_2":"JP-45","name":"Miyazaki","name_local":"宮崎県","latitude":32.0981,"longitude":131.286}},{"arcs":[[[136]],[[137]],[[-136,138,-130]]],"type":"MultiPolygon","properties":{"iso_3166_2":"JP-46","name":"Kagoshima","name_local":"鹿児島県","latitude":29.4572,"longitude":129.601}},{"arcs":[[[139]],[[140]],[[141]],[[142]],[[143]],[[144]]],"type":"MultiPolygon","properties":{"iso_3166_2":"JP-47","name":"Okinawa","name_local":"沖縄県","latitude":24.3349,"longitude":123.802}}]}},"arcs":[[[10504,13599],[-68,30],[31,66],[76,-60],[-39,-36]],[[10936,13828],[116,-101],[184,-182],[52,-86],[202,-193],[245,-173],[157,-87],[59,-53],[125,22],[123,-15],[103,-104],[200,-22],[52,16],[125,117],[88,54],[80,90],[5,-86],[-51,-91],[-90,-123],[-17,-81],[69,-86],[56,-141],[17,-83],[84,-14],[29,-51],[-123,0],[-102,-35],[-16,-48],[-114,-43],[-63,43],[-29,-78],[-141,6],[-87,45],[-93,-18],[-170,-86],[-143,-118],[-110,-133],[-57,-87],[-6,-110],[-55,-143],[-73,64],[-90,50],[-116,35],[-171,73],[-104,61],[-64,60],[-61,7],[-78,57],[-115,39],[-171,-35],[-195,-111],[-43,-50],[-162,161],[-120,11],[-62,-28],[-52,-68],[-20,-112],[149,-100],[94,18],[150,-141],[120,-61],[-102,-70],[-171,74],[-61,-57],[-86,-36],[-30,-108],[-73,-21],[-38,-51],[-98,26],[-34,90],[23,74],[77,140],[-52,108],[-77,37],[-82,70],[-10,41],[46,103],[-4,101],[43,34],[79,9],[84,78],[27,-26],[162,156],[-109,127],[13,73],[64,32],[195,-118],[101,22],[20,-33],[104,-19],[112,87],[25,83],[-41,57],[13,53],[-31,87],[36,59],[73,23],[64,63],[18,83],[-9,136],[54,95],[25,111],[-5,110],[-36,122],[-77,135],[-2,57],[63,97],[75,12],[78,57],[34,-35]],[[10742,10596],[-83,-61],[-135,0],[-159,-89],[-57,17]],[[10308,10463],[21,80],[-12,64],[-52,21],[-77,-49],[-100,-11],[-107,43],[-32,-16],[-147,8],[-59,-21]],[[9743,10582],[-1,75],[-47,42],[107,102],[43,-15],[86,44],[30,150],[-10,59],[21,84],[54,-44],[91,14],[46,-210],[71,-36],[42,49],[62,13],[77,-40],[43,25],[28,67],[20,109],[-50,60],[-72,-61],[-46,8],[-104,-43],[-19,43],[41,145],[52,73],[105,-44],[96,-72],[106,22],[-39,-146],[0,-147],[17,-134],[27,-85],[122,-93]],[[10718,9639],[-89,5],[-23,-108],[-72,3],[-58,-39],[-140,82],[-125,46]],[[10211,9628],[22,140],[-79,145],[89,174],[33,148],[-17,56],[8,130],[41,42]],[[10742,10596],[92,-146],[8,-109],[55,-38],[34,-158],[-18,-68],[54,-62],[-77,-107],[-16,-178],[-93,-79],[-63,-12]],[[10311,8942],[-52,-63],[-83,5],[-25,54],[-97,13],[-46,33],[-77,7]],[[9931,8991],[21,62],[52,20],[36,98],[73,143],[-27,114],[45,73],[-50,82]],[[10081,9583],[64,4],[66,41]],[[10718,9639],[2,-52],[-64,-69],[21,-33],[-59,-103],[29,-23],[-32,-148],[-73,67],[-136,-25],[-75,-129],[-23,-79],[3,-103]],[[10081,9583],[-109,79],[-75,10],[-102,56],[-89,6]],[[9706,9734],[30,111],[36,25],[32,116],[5,144],[-17,62],[-88,45],[-66,-24],[-36,96],[72,-29],[89,106],[27,149],[-47,47]],[[9931,8991],[2,-107],[-29,-36],[-70,-14],[-98,58],[-119,6]],[[9617,8898],[-61,49],[36,188],[94,35],[15,37],[-99,64],[2,63],[-87,31]],[[9517,9365],[44,89],[84,88],[61,192]],[[10311,8942],[50,-97],[13,-233],[-38,-243],[-102,-99]],[[10234,8270],[-105,31],[-84,-68],[-134,86]],[[9911,8319],[-3,50],[-77,67],[-136,17],[-287,-149]],[[9408,8304],[-84,29]],[[9324,8333],[12,125],[-44,65],[39,134],[89,8],[100,37],[-12,56],[109,140]],[[10234,8270],[-32,-52],[-76,-216],[5,-61],[-30,-36],[7,-79],[39,-95],[123,-180]],[[10270,7551],[-178,100],[-106,-7],[-102,-24],[-126,46],[-95,107],[-30,1]],[[9633,7774],[-45,46]],[[9588,7820],[-13,33]],[[9575,7853],[81,25],[93,78],[125,25],[34,64],[-2,122],[14,47],[-9,105]],[[9575,7853],[-37,38],[-84,4],[-57,58],[61,139],[-83,47],[38,110],[-5,55]],[[9588,7820],[-323,78],[-54,-92],[-153,-66],[-31,-38]],[[9027,7702],[-50,47],[-16,243],[-84,-11],[-34,30],[32,116],[42,40],[100,28]],[[9017,8195],[66,16],[94,89],[0,40],[70,52],[77,-59]],[[9633,7774],[71,-148],[-7,-47]],[[9697,7579],[-61,11],[-128,-28],[-86,1],[-66,36],[-159,43],[-41,-26]],[[9156,7616],[-120,39]],[[9036,7655],[-9,47]],[[10270,7551],[-114,-29],[-102,-81],[-57,-119],[5,-118],[-43,-43],[-107,-5],[-82,-66],[-37,-73],[-84,30],[50,38],[-25,120],[23,16],[-11,98],[93,63],[41,84],[-73,45],[-50,-27]],[[9697,7484],[0,95]],[[9697,7484],[-45,-77]],[[9652,7407],[-141,65],[-94,-29],[-75,15],[-72,40]],[[9270,7498],[-50,28],[-64,90]],[[9652,7407],[-60,-48],[-18,-90],[44,-59],[-64,-48],[-41,113],[-75,7],[-104,-21],[-50,-32],[-30,-76]],[[9254,7153],[-70,55],[9,110],[-50,4]],[[9143,7322],[18,36],[86,44],[23,96]],[[8877,9055],[79,7],[-52,-118],[-127,-60],[45,108],[-63,27],[45,104],[120,90],[-47,-158]],[[9017,8195],[-8,68],[-53,55],[-11,50],[-100,-8],[-96,-82],[-99,-35],[-21,49],[-70,26],[-48,-78],[-39,-18]],[[8472,8222],[-23,89],[-45,40]],[[8404,8351],[161,54],[116,74],[86,8],[175,125],[123,165],[53,125],[116,76],[141,63],[74,82],[18,133],[50,109]],[[8472,8222],[-9,-119],[-55,-107],[-33,-30]],[[8375,7966],[-173,47],[-77,-17],[-100,-97],[-69,42],[-36,-31]],[[7920,7910],[-9,96],[11,172],[53,128],[100,34]],[[8075,8340],[-23,-77],[88,-49],[102,1],[53,103],[109,33]],[[7920,7910],[23,-29],[-53,-111]],[[7890,7770],[-38,-7],[-71,50],[-127,21],[-48,72]],[[7606,7906],[116,96],[121,148],[70,135],[3,71],[-50,141],[40,103],[107,26],[102,57],[105,28],[-37,-154],[-70,-6],[-55,-64],[-49,24],[-23,-72],[89,-99]],[[7890,7770],[-13,-91],[47,-30],[-8,-62],[-180,-25],[-82,1],[-30,-69]],[[7624,7494],[-52,18],[-13,-60],[-44,-43],[-86,-16],[-30,-71],[-72,-28]],[[7327,7294],[-118,18],[-50,47],[16,68]],[[7175,7427],[18,-29],[123,-5],[-10,47],[85,11],[68,62],[-10,34],[84,30],[-61,71],[-22,57],[118,180],[38,21]],[[9143,7322],[-118,-19],[-80,43],[-20,-23],[-7,-118],[-46,-26],[-59,92],[-55,8],[7,104],[-27,99]],[[8738,7482],[-16,45],[27,99],[37,3],[39,62],[68,-42],[143,6]],[[8738,7482],[-30,-43],[-9,-114],[-25,-31],[-161,-91]],[[8513,7203],[-132,-4],[-16,52]],[[8365,7251],[34,79],[-13,66],[-80,154],[-70,44],[81,57],[67,108],[-25,39],[50,127],[-34,41]],[[8365,7251],[-81,-36],[-66,35],[-53,-18],[-70,25],[-71,68],[-116,-29],[-42,-67],[-3,-62]],[[7863,7167],[-91,59],[-68,-19]],[[7704,7207],[5,123],[-28,92],[-57,72]],[[9254,7153],[-4,-78],[31,-82],[-31,-18],[-58,-102],[-86,-57],[-54,86],[34,254],[-61,11],[-82,-28],[-23,-75],[-84,-40],[-14,-60],[-73,-73],[-15,-73],[-82,35],[-89,8],[-57,-18],[-63,21],[-125,0]],[[8318,6864],[13,89],[69,39],[43,86],[50,51],[20,74]],[[8318,6864],[-187,-52],[-18,23],[123,90],[-59,34],[-37,-24],[-79,1],[-52,42],[-37,-17],[-23,86],[-41,46]],[[7908,7093],[-45,74]],[[7908,7093],[-54,-26],[-11,-63],[-60,-79],[-9,-55],[134,-108],[62,-21],[32,-67],[-41,-44],[-164,-32],[-22,10],[-128,-78],[-14,-118],[-99,-51],[-62,-132]],[[7472,6229],[-75,64],[-9,33]],[[7388,6326],[89,100],[48,11],[18,150],[-28,87],[82,71],[-88,50],[-14,98]],[[7495,6893],[-18,38]],[[7477,6931],[70,64],[66,-7],[70,27],[26,41],[20,112],[-25,39]],[[7477,6931],[-86,75],[-23,75],[7,166],[-48,47]],[[7495,6893],[-116,-11],[-73,39]],[[7306,6921],[-34,90],[-63,7],[-100,57]],[[7109,7075],[22,51],[-41,36],[-236,116],[11,48],[64,20],[-105,99],[-2,56]],[[6822,7501],[36,-11],[91,64],[82,22],[44,-54],[-67,-81],[85,-18],[82,4]],[[7306,6921],[-48,-139],[25,-33],[-11,-78]],[[7272,6671],[-264,-63],[-59,16]],[[6949,6624],[71,28],[64,55],[54,84],[0,87]],[[7138,6878],[20,24],[-6,112],[-43,61]],[[6852,6649],[23,-44],[-132,-52],[-41,64],[82,103],[106,100],[0,-63],[-47,-55],[9,-53]],[[7138,6878],[-73,8],[-43,-31],[-97,-21],[-200,98],[-101,-11],[-124,-32]],[[6500,6889],[-26,72],[3,117],[75,97],[0,50]],[[6552,7225],[55,10],[9,50],[-51,142],[-31,37]],[[6534,7464],[98,47],[190,-10]],[[7388,6326],[-18,22],[-127,11],[9,43],[-41,71],[57,83],[40,20],[-36,95]],[[7472,6229],[-63,-103],[-69,-30],[-74,8],[-110,36],[-77,139],[-141,77],[16,118],[54,45],[-59,105]],[[6552,7225],[-127,-44],[-25,52],[-105,54],[-66,-54],[-57,34],[-90,13],[-44,-90],[-61,-12],[-75,-68]],[[5902,7110],[-78,9]],[[5824,7119],[19,91],[79,48],[10,92],[-44,26],[9,47]],[[5897,7423],[82,-54],[103,52],[88,-20],[175,11],[116,17],[73,35]],[[5824,7119],[-147,7],[-202,-184],[-57,5],[-112,-23],[-43,-31],[-59,-166]],[[5204,6727],[-61,-99],[-103,11],[1,60],[-59,51],[22,49],[-16,65]],[[4988,6864],[105,28],[218,207],[45,18],[53,73],[147,99],[-16,72],[116,43],[76,7],[77,51],[88,-39]],[[5968,7856],[-32,-32],[-79,38],[13,52],[48,30],[50,-88]],[[6500,6889],[-85,-47],[-6,-26],[-94,-43],[-27,-50],[-66,7],[-70,40],[-61,-28],[-87,-5]],[[6004,6737],[-29,87],[-18,119],[-30,54],[-25,113]],[[6004,6737],[-68,-89],[-45,58],[-46,-86],[-61,25],[-128,-14],[-104,-72],[-55,13],[-38,92],[-64,3],[-93,-82],[11,-32]],[[5313,6553],[-56,25],[-42,85],[-11,64]],[[5313,6553],[-23,-52],[7,-77],[-59,-81],[-213,124],[-100,-45],[-105,30],[-64,-69],[-136,79],[-61,-67],[-11,135],[-23,82],[32,44],[84,49],[93,-27],[104,27],[105,152],[45,7]],[[6495,6128],[-61,13],[-18,68],[-57,14],[-9,60],[-71,10],[-157,44]],[[6122,6337],[7,93]],[[6129,6430],[96,61],[79,-14],[146,58],[116,0],[13,30]],[[6579,6565],[96,20],[15,-47],[-24,-77],[59,-62],[-26,-106],[-142,-85],[-62,-80]],[[6129,6430],[-39,17]],[[6090,6447],[62,133],[141,94],[79,-19],[41,25],[61,-60],[105,-55]],[[6122,6337],[-104,-24],[-114,-8],[-52,-22],[-64,-99],[-18,-69],[-50,-40],[-73,1],[35,-87],[-121,-125],[-16,-137]],[[5545,5727],[-98,15],[16,39],[-45,133],[-25,172],[70,103],[100,58],[21,122],[32,60],[86,45],[14,48],[106,-135],[112,37],[122,-12],[34,35]],[[6495,6128],[-30,-45],[-27,-97],[-52,3],[-105,115],[-106,28],[-76,-14],[-81,-39],[-30,-40],[-93,-43],[0,-70],[-89,-111],[-47,-15],[-9,-100],[-50,-58],[-59,-25],[-109,39],[13,71]],[[4715,6180],[-45,-79],[-100,-3],[-64,-90],[-2,-170]],[[4504,5838],[-61,34],[-86,-23],[-46,-64],[-39,-13]],[[4272,5772],[-6,70],[-41,34]],[[4225,5876],[23,66],[83,61],[-174,86],[-112,-9]],[[4045,6080],[32,75],[80,52],[31,-49],[60,18],[-1,46],[46,43],[-11,37],[58,52],[139,41],[121,-37],[11,-104],[48,-65],[56,-9]],[[4225,5876],[-62,31],[-52,-50],[30,-108]],[[4141,5749],[-98,28],[-62,52],[-11,53],[-45,17],[-41,66],[34,34]],[[3918,5999],[30,43],[-46,37],[37,50],[106,-49]],[[3357,5630],[0,-37],[-60,-63],[-77,5],[57,85],[80,10]],[[4141,5749],[24,-45],[55,-12],[12,-108],[-103,-63],[-31,32],[47,60],[-18,39],[-125,-27],[-39,-58],[-81,101],[-32,13],[-37,90],[50,65],[59,-64],[-16,-68],[30,-23],[48,58],[9,56],[-37,30],[-77,3],[-34,48],[-79,55],[16,94],[136,-26]],[[3768,6050],[4,-28],[-66,-109],[-38,20],[100,117]],[[3888,6316],[12,-54],[-73,3],[16,75],[45,-24]],[[3577,6620],[55,-22],[-12,-57],[-73,-15],[30,94]],[[3716,6884],[15,-43],[-25,-78],[-40,-40],[18,-65],[-78,15],[30,104],[-2,72],[82,35]],[[4132,5476],[11,-113],[-43,-53],[-66,19],[-25,40],[39,105],[84,2]],[[4786,5670],[-48,-18],[-113,-149],[-27,-59],[52,-102],[-5,-84],[-82,-45],[-129,-15]],[[4434,5198],[-71,47],[-95,-33],[-46,32]],[[4222,5244],[76,121],[49,50],[5,83],[57,61],[-53,32],[9,75],[-88,70],[-5,36]],[[4504,5838],[68,-32],[53,95],[56,-34],[39,-63],[30,-105],[36,-29]],[[5100,5612],[-71,59],[-27,-35],[-114,-6],[-15,36],[-87,4]],[[4715,6180],[125,-19],[58,61],[84,-6],[41,-69],[-23,-100],[-107,-86],[114,-1],[93,-46],[-35,-47],[85,-39],[-32,-54],[47,-61],[-2,-57],[-63,-44]],[[5100,5612],[-41,-32],[-68,-95],[-51,-150],[-84,-276],[16,-73],[-15,-72],[-62,-171],[-43,-3],[-66,59]],[[4686,4799],[23,66],[-89,46],[-20,50],[-69,50],[-4,55],[-41,31],[-52,101]],[[4311,4149],[102,-59],[-57,-90],[-81,2],[-35,100],[71,47]],[[4620,4208],[-39,-50],[-4,-70],[-61,-4],[-1,49],[57,100],[-7,50],[64,108],[16,-92],[-25,-91]],[[4686,4799],[-46,-16],[-33,-55],[52,-22],[-103,-139],[-115,-43],[41,180],[-59,142],[61,43],[-14,64],[-75,2],[-73,-156],[32,-102],[50,-29],[-13,-54],[-59,-15],[-48,55],[-132,-1],[-18,44],[59,84],[25,117],[-95,106],[27,90],[-23,105],[95,45]],[[454,237],[82,-26],[-36,-71],[-71,46],[25,51]],[[723,261],[-10,-53],[-59,-14],[9,64],[60,3]],[[3052,1720],[-88,-55],[-125,-111],[-98,-149],[16,-50],[-84,-36],[-9,70],[61,83],[-5,78],[118,58],[-31,57],[47,50],[28,-41],[122,109],[60,7],[-12,-70]],[[3259,2182],[-62,-46],[-16,43],[78,3]],[[3427,2353],[-39,28],[0,105],[41,3],[34,-90],[-36,-46]],[[3863,2837],[-57,-22],[-38,-46],[-77,-51],[-28,-53],[-75,29],[-7,58],[58,41],[108,18],[25,37],[91,-11]]]};

  /**************************************
                Utilities
  ***************************************/

  //convert lat/lng coords to X / Y coords
  Datamap.prototype.latLngToXY = function(lat, lng) {
     return this.projection([lng, lat]);
  };

  //add <g> layer to root SVG
  Datamap.prototype.addLayer = function( className, id, first ) {
    var layer;
    if ( first ) {
      layer = this.svg.insert('g', ':first-child')
    }
    else {
      layer = this.svg.append('g')
    }
    return layer.attr('id', id || '')
      .attr('class', className || '');
  };

  Datamap.prototype.updateChoropleth = function(data) {
    var svg = this.svg;
    for ( var subunit in data ) {
      if ( data.hasOwnProperty(subunit) ) {
        var color;
        var subunitData = data[subunit]
        if ( ! subunit ) {
          continue;
        }
        else if ( typeof subunitData === "string" ) {
          color = subunitData;
        }
        else if ( typeof subunitData.color === "string" ) {
          color = subunitData.color;
        }
        else {
          color = this.options.fills[ subunitData.fillKey ];
        }
        //if it's an object, overriding the previous data
        if ( subunitData === Object(subunitData) ) {
          this.options.data[subunit] = defaults(subunitData, this.options.data[subunit] || {});
          var geo = this.svg.select('.' + subunit).attr('data-info', JSON.stringify(this.options.data[subunit]));
        }
        svg
          .selectAll('.' + subunit)
          .transition()
            .style('fill', color);
      }
    }
  };

  Datamap.prototype.updatePopup = function (element, d, options) {
    var self = this;
    element.on('mousemove', null);
    element.on('mousemove', function() {
      var position = d3.mouse(this);
      d3.select(self.svg[0][0].parentNode).select('.datamaps-hoverover')
        .style('top', ( (position[1] + 30)) + "px")
        .html(function() {
          var data = JSON.parse(element.attr('data-info'));
          //if ( !data ) return '';
          return options.popupTemplate(d, data);
        })
        .style('left', ( position[0]) + "px");
    });

    d3.select(self.svg[0][0].parentNode).select('.datamaps-hoverover').style('display', 'block');
  };

  Datamap.prototype.addPlugin = function( name, pluginFn ) {
    var self = this;
    if ( typeof Datamap.prototype[name] === "undefined" ) {
      Datamap.prototype[name] = function(data, options, callback, createNewLayer) {
        var layer;
        if ( typeof createNewLayer === "undefined" ) {
          createNewLayer = false;
        }

        if ( typeof options === 'function' ) {
          callback = options;
          options = undefined;
        }

        options = defaults(options || {}, defaultOptions[name + 'Config']);

        //add a single layer, reuse the old layer
        if ( !createNewLayer && this.options[name + 'Layer'] ) {
          layer = this.options[name + 'Layer'];
          options = options || this.options[name + 'Options'];
        }
        else {
          layer = this.addLayer(name);
          this.options[name + 'Layer'] = layer;
          this.options[name + 'Options'] = options;
        }
        pluginFn.apply(this, [layer, data, options]);
        if ( callback ) {
          callback(layer);
        }
      };
    }
  };

  // expose library
  if ( typeof define === "function" && define.amd ) {
    define( "datamaps", function(require) { d3 = require('d3'); topojson = require('topojson'); return Datamap; } );
  }
  else {
    window.Datamap = window.Datamaps = Datamap;
  }

  if ( window.jQuery ) {
    window.jQuery.fn.datamaps = function(options, callback) {
      options = options || {};
      options.element = this[0];
      var datamap = new Datamap(options);
      if ( typeof callback === "function" ) {
        callback(datamap, options);
      }
      return this;
    };
  }
})();
