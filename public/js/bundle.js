// window.$ = window.jQuery = require('jquery');
function hxlProxyToJSON(input){
    var output = [];
    var keys=[]
    input.forEach(function(e,i){
        if(i==0){
            e.forEach(function(e2,i2){
                var parts = e2.split('+');
                var key = parts[0]
                if(parts.length>1){
                    var atts = parts.splice(1,parts.length);
                    atts.sort();                    
                    atts.forEach(function(att){
                        key +='+'+att
                    });
                }
                keys.push(key);
            });
        } else {
            var row = {};
            e.forEach(function(e2,i2){
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}
$( document ).ready(function() {

// -- all global vars
  const DATA_URL = 'data/';
  let isMobile = $(window).width()<600? true : false;
  let communityFeedbackURL = 'data/Data_ DRC Ebola response community feedback - community_feedback.csv';
  // let communityFeedbackURL = 'data/community_feedback.csv';

  let burdenURL = 'data/Data_ DRC Ebola response community feedback - ebola_burden_all.csv' ;
  let locationsURL = 'data/Data_ DRC Ebola response community feedback - locations.csv' ;
  let communityData, locationsData, burdenData = '';
  let mainChart ;
  let typesList       = [],
      categoriesList  = [],
      healthzonesList = [];

  let primeColor = '#0073b7' ;


// -- all global vars //

  function setKeyFigures (argument) {
    //get from-to date
    fromDate = $("#from").datepicker('getDate');
    toDate = $("#to").datepicker('getDate');

    //get selected healthzone
    var selectionHZ = $('.health-zone-dropdown option:selected').text();
    var data = burdenData;

    //filter data through date range
    
    data = data.filter(function(d){ return d['health_zone'] == selectionHZ; });
    var dataByHZ = d3.nest()
        .key(function(d){ return d['health_zone']; })
        .rollup(function(v){
          return {
            cases: d3.sum(v, function(d){ return d['confirmed_cases']; }),
            deaths: d3.sum(v, function(d){ return d['confirmed_deaths']; })
          };})
        .entries(data);

    //check what feedback data refers to
    var totalFeedback  = 4556 ;

    $('#cases').text(dataByHZ[0].value['cases']); 
    $('#deaths').text(dataByHZ[0].value['deaths']);
    $('#feedbacks').text(totalFeedback);
  }//setKeyFigures

  function setFilters (argument) {
    // should maybe use other data source
    communityData.forEach( function(element, index) {
      typesList.includes(element['type']) ? '': typesList.push(element['type']);
      categoriesList.includes(element['category']) ? '': categoriesList.push(element['category']);
      healthzonesList.includes(element['health_zone']) ? '': healthzonesList.push(element['health_zone']);
    });

    var dropdownType = d3.select(".type-dropdown")
        .selectAll("option")
        .data(typesList)
        .enter().append("option")
          .text(function(d){ return d ;})
          .attr("value", function(d){ return d; });

    var dropdwonCategory = d3.select(".category-dropdown")
        .selectAll("option")
        .data(categoriesList)
        .enter().append("option")
          .text(function(d){ return d; })
          .attr("value", function(d){ return d; });

    var dropdwonHealthZone = d3.select(".health-zone-dropdown")
        .selectAll("option")
        .data(healthzonesList)
        .enter().append("option")
          .text(function(d){ return d; })
          .attr("value", function(d){ return d; });

    var miniDate = new Date(d3.min(communityData,function(d){return d['date'];}));
    var maxiDate = new Date(d3.max(communityData,function(d){return d['date'];}));
    
    var dateFormat = "yy-mm-dd";
    var from = $("#from")
        .datepicker({
          dateFormat : dateFormat,
          minDate : miniDate,
          maxDate : maxiDate
        });
    var to = $("#to")
        .datepicker({
          dateFormat : dateFormat,
          minDate : miniDate,
          maxDate : maxiDate
        });
    $("#from").datepicker( "setDate" , miniDate );
    $("#to").datepicker( "setDate" , maxiDate );

  }//setFilters

  function getFilters (argument) {
    // body... 
  } //getFilters

  //from date on change 
  $('#from').datepicker().on('change', function(e){
    updateDashoard();
  });

  //to date on change 
  $('#to').on('changeDate', function(e){
    updateDashoard();
  });

  //filter type on change
  $('.type-dropdown').on('change', function(e){
    updateDashoard();
  });

  //filter healthzone on change
  $('.health-zone-dropdown').on('change', function(e){
    updateDashoard();
  });

  //radio Trend analysis checked
  $('#trendAnalysis').change(function(d){
    $('#trendAnalysis').is(':checked') ? console.log("c est check") : console.log('c est pas check');
  })

  //get filters values and update chart accordingly 
  function updateDashoard () {

    setKeyFigures();
    var filteredData = getCommunityFeedbackData();

    var selectionHZ = $('.health-zone-dropdown option:selected').text();
    filteredData[1][0] = selectionHZ ;

    var charts = mainChart.data.shown();
    var loadedCharts = [];
    for ( k in charts){
      loadedCharts.push(charts[k].id)
    }
    mainChart.load({
      unload: loadedCharts, 
      color: primeColor,
      columns: filteredData,
    });

  }//updateDashoard

  function drawCharts (argument) {
    var data = getCommunityFeedbackData();
    var barChart, lineChart = '';

    barChart = c3.generate({
        bindto: '#mainChart',
        padding: { left: 150
        },
        size: { height: 250 },
        color: {
          primeColor
        },
        data: {
            x: 'x',
            columns: data,
            type: 'bar',
        },
        axis: {
            rotated: true,
            x: {
                type: 'category',
                tick: {
                    multiline: false,
                    centered: true,
                    outer: false
                }
            },
            y: { show: false }
        },
        legend: { hide: 'x' }
    });

    // lineChart = c3.generate({
    //     bindto: '#mainChart',
    //     size: { height: 250 },
    //     padding: { left: 20 },
    //     color: {
    //       primeColor
    //     },
    //     data: {
    //         x: 'x',
    //         columns: [
    //           ['x', '2013-01-01', '2013-01-02', '2013-01-03', '2013-01-04', '2013-01-05', '2013-01-06'],
    //           ['data1', 30, 200, 100, 400, 150, 250]
    //         ]
    //     },
    //     axis: {
    //         x: {
    //             type: 'timeseries',
    //             localtime: false,
    //             tick: {
    //                 culling: { max: 4 },
    //                 format: '%b %Y',
    //                 outer: false
    //             }
    //         },
    //         y: {
    //             tick: {
    //                 count: 5,
    //             },
    //             show : false
    //         }
    //     }
    // });

    mainChart = barChart ;
    // mainChart = lineChart ;
  }//drawCharts

  var sort_value = function (d1, d2) {
    if (d1.value > d2.value) return -1;
    if (d1.value < d2.value) return 1;
    return 0;
  }

  function getCommunityFeedbackData () {
    //get from-to date
    fromDate = $("#from").datepicker('getDate');
    toDate = $("#to").datepicker('getDate');

    //get selected type
    var selectionType = $('.type-dropdown option:selected').text();

    //get selected category
    var selectionCategory = $('.category-dropdown option:selected').text();

    //get selected healthzone
    var selectionHZ = $('.health-zone-dropdown option:selected').text();

    var data = communityData;
    data = data.filter(function(d){
      var dt = new Date(d['date']) ;
      return fromDate <= dt <= toDate ;
    });
    
    data = data.filter(function(d){ return d['type'] == selectionType; });
    data = data.filter(function(d){ return d['health_zone'] == selectionHZ; });
    // data = data.filter(function(d){ return d['type'] == selectionType; });


    var dataByMetric = d3.nest()
        .key(function(d) { return d['category']; })
        .rollup(function(v){ return d3.sum(v, function(d){ return d['n']; }); })
        .entries(data);
    
    var total = d3.sum(dataByMetric, function(d){ return d['value']; });

    dataByMetric.forEach( function(element, index) {
      var pct = ((element['value'] / total) * 100).toFixed(2);
      element['value'] = pct;
    })
    dataByMetric.sort(sort_value);

    var numCategory = 5 ;
    var xCategoryArr = ['x'],
        yCategoryArr = []; //first value should behealthzone filter value

    yCategoryArr[0] = selectionHZ;
    if (dataByMetric.length >= numCategory) {
      for (var i = 0; i < numCategory; i++) {
        xCategoryArr.push(dataByMetric[i].key);
        yCategoryArr.push(parseFloat(dataByMetric[i].value));
      }
    } else {
      for (var i = 0; i < dataByMetric.length; i++) {
        xCategoryArr.push(dataByMetric[i].key);
        yCategoryArr.push(parseFloat(dataByMetric[i].value));
      }
      
    }

    return [xCategoryArr, yCategoryArr]
  } //getCommunityFeedbackData

  function createMarker (d) {
    return L.marker([d.lat, d.lon], {
        icon: L.divIcon({
            className: 'circle',
            iconSize: null//[15,15]
        })
    }) 
  }//createMarker

  function updateDashoardFromMap (event) {
    $('.health-zone-dropdown').val(event.layer.healthZone);
    updateDashoard();
  } //updateDashoardFromMap

  function generateMap (argument) {
    var map = L.map('map',
      {
        maxZoom : 10,
        minZoom: 4
      }); 
    map.setView([-0.361, 29.053], 8); //-2.712/23.244 -4.579, 21.887
    L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/traffic-day-v2/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYW1hZG91MTciLCJhIjoib3NhRnROQSJ9.lW0PVXVIS-j8dGaULTyupg', { 
      attribution: '<a href="http://mapbox.com">Mapbox</a>'
    }).addTo(map);

    var myFeatureGroup = L.featureGroup().addTo(map).on("click", updateDashoardFromMap);
    var marker, healthZone ;

    var locs = [];
    locationsData.forEach( function(element, index) {
      if (healthzonesList.includes(element.health_zone)) {
        var obj = {
          name : element.health_zone,
          lat  : element.lat,
          lon  : element.lng 
        }
        locs.push(obj);
      }
    });

    locs.forEach( function(element, index) {
      marker = createMarker(element).addTo(myFeatureGroup).bindPopup(element.name);
      healthZone = element.name ;
      marker.healthZone = healthZone ;
    });
  }//generateMap

  function getData() {
    Promise.all([
      d3.csv(communityFeedbackURL),
      d3.csv(burdenURL),
      d3.csv(locationsURL)
    ]).then(function(data){
      communityData = data[0];
      burdenData = data[1];
      locationsData = data[2];

      setFilters();
      setKeyFigures();
      drawCharts();
      generateMap();
      
    });
  } //getData

  function initTracking() {
    //initialize mixpanel
    let MIXPANEL_TOKEN = '';
    mixpanel.init(MIXPANEL_TOKEN);
    mixpanel.track('page view', {
      'page title': document.title,
      'page type': 'datavis'
    });
  }

  getData();

  //initTracking();
});