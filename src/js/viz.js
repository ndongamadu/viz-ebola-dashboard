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
  let dataTableData = [];

  let multiBarCharts = false;
  let switchTrend = false;



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
            cases: d3.sum(v, function(d){ return d['confirmed_cases_change']; }),
            deaths: d3.sum(v, function(d){ return d['confirmed_deaths_change']; })
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
    
    $(".category-dropdown").multipleSelect({
      minimumCountSelected : 1,
      // formatCountSelected:function (d) {
      //   return '{0}/{1} categories';
      // },
      onClose: function(){
        getCategories();
      }
     });

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

  function selectValue (argument) {
    $('.category-dropdown').multipleSelect('setSelects', categoriesList[0]);
  }

  function getCategories (argument) {
    // var cats = $('.category-dropdown').val();
    updateDashoard();
  } //getFilters

  //from date on change 
  $('#from').datepicker().on('change', function(e){
    updateDashoard();
    updateDataTable();
  });

  //to date on change 
  $('#to').on('changeDate', function(e){
    updateDashoard();
    updateDataTable();
  });

  //filter type on change
  $('.type-dropdown').on('change', function(e){
    updateDashoard();
    updateDataTable();
  });


  //filter healthzone on change
  $('.health-zone-dropdown').on('change', function(e){
    updateDashoard();
    updateDataTable();
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
      columns: [filteredData[0],filteredData[1]]
    });

    // drawTable(filteredData[2]);
  }//updateDashoard

  function updateDataTable (argument) {
    $('#datatable').dataTable().fnClearTable();
    $('#datatable').dataTable().fnAddData(dataTableData); 
  }

  function drawTable (argument) {
    $('#datatable').DataTable({
      data : dataTableData,
      "bFilter" : false,
      "bLengthChange" : false
    });
  } //drawTable

  function drawCharts (argument) {
    var data = getCommunityFeedbackData(); // returns [x, y, datatable]
    var barChart = '';

    if (! switchTrend) {
      if (multiBarCharts) {
        //multiBarCharts
        barChart = c3.generate({
            bindto: '#mainChart',
            padding: { left: 150
            },
            size: { height: 300 },
            color: {
              primeColor
            },
            data: {
                x: 'x',
                columns: [
                  ['x', 'cat1', 'cat2', 'cat3', 'cat4', 'cat5',],
                  ['data1', 2, 3, 5, 6,7],
                  ['data2', 6,5,8,2,1]
                ],
                type: 'bar',
                group: [
                  ['data1', 'data2']
                ],
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
      } else {
        // one bar chart
        barChart = c3.generate({
            bindto: '#mainChart',
            padding: { left: 150
            },
            size: { height: 300 },
            color: {
              primeColor
            },
            data: {
                x: 'x',
                columns: [data[0], data[1]],
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
      }
    } else {
      //trend
      barChart = c3.generate({
          bindto: '#mainChart',
          size: { height: 250 },
          padding: { left: 20 },
          color: {
            primeColor
          },
          data: {
              x: 'x',
              columns: [
                ['x', '2013-01-01', '2013-01-02', '2013-01-03', '2013-01-04', '2013-01-05', '2013-01-06'],
                ['data1', 30, 200, 100, 400, 150, 250]
              ]
          },
          axis: {
              x: {
                  type: 'timeseries',
                  localtime: false,
                  tick: {
                      culling: { max: 4 },
                      format: '%b %Y',
                      outer: false
                  }
              },
              y: {
                  tick: {
                      count: 5,
                  },
                  show : false
              }
          }
      });
    }

    mainChart = barChart ;
    drawTable(dataTableData);
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
    var selectionCategory = $('.category-dropdown').val();

    //get selected healthzone
    var selectionHZ = $('.health-zone-dropdown option:selected').text();

    var data = communityData;
    data = data.filter(function(d){
      var dt = new Date(d['date']) ;
      return fromDate <= dt <= toDate ;
    });
    
    data = data.filter(function(d){ return d['type'] == selectionType; });
    data = data.filter(function(d){ return d['health_zone'] == selectionHZ; });

    if (selectionCategory !=null) {
      selectionCategory > 1 ? multiBarCharts=true : '';
      for (var i = 0; i < selectionCategory.length; i++) {
        data = data.filter(function(d){ return d['category'] == selectionCategory[i]; });
      }
    } 

    //set datatable data 
    var dataT = [];
    for (var i = 0; i < data.length; i++) {
      dataT.push([data[i]['category'], data[i]['sample_comments'], data[i]['health_zone']]);
    }
    dataTableData = dataT;

    var dataByMetric = d3.nest()
        .key(function(d) { return d['health_zone']; })
        .key(function(d) { return d['category']; })
        .rollup(function(v){ return d3.sum(v, function(d){ return d['n']; }); })
        .entries(data);

    //depending on number of health zone selected
    var numberOfHealthZone = 1;
    var total = 0;

    var numCategory    = 5 ;
    var xCategoryArr   = ['x'],
        yCategoryArr   = [],
        yCategoriesArr = [];

    if (numberOfHealthZone==1) {
      total = d3.sum(dataByMetric[0].values, function(d){ return d['value']; });
      dataByMetric[0].values.forEach( function(element, index) {
        var pct = Number(((element['value'] / total) * 100).toFixed(2));
        element['value'] = pct;
      });
      dataByMetric[0].values.sort(sort_value);
      yCategoryArr[0] = selectionHZ;
      if (dataByMetric[0].values.length >= numCategory) {
        for (var i = 0; i < numCategory; i++) {
          xCategoryArr.push(dataByMetric[0].values[i].key);
          yCategoryArr.push(parseFloat(dataByMetric[0].values[i].value));
        }
      } else {
        for (var i = 0; i < dataByMetric.length; i++) {
          xCategoryArr.push(dataByMetric[i].key);
          yCategoryArr.push(parseFloat(dataByMetric[i].value));
        }
      }

    } else {
      dataByMetric.forEach( function(element, index) {
        total = d3.sum(element.values, function(d){ return d['value']; });
        element.values.forEach( function(element, index) {
          var pct = Number(((element['value'] / total) * 100).toFixed(2));
          element['value'] = pct;
        });
        element.values.sort(sort_value);
        var arr = [];
        arr[0] = element.key; 
        if (element.values.length >= numCategory) {
          xCategoryArr.push(element.key);
          for (var i = 0; i < numCategory; i++) {
            arr.push(element.values[i].value)
          }
        } else {
          // second expression
        }
      });
    } 

    return [xCategoryArr, yCategoryArr]
  } //getCommunityFeedbackData

  function createMarker (d) {
    return L.marker([d.lat, d.lon], {
        icon: L.icon({
            // className: 'circle',
            iconUrl: '/assets/healthsite-marker-red.png',
            iconSize: [38,50],
            iconAnchor: [20, 60]
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