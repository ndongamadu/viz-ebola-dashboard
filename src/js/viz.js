$( document ).ready(function() {

// -- all global vars
  const DATA_URL = 'data/';
  let isMobile = $(window).width()<600? true : false;
  let communityFeedbackURL = 'data/Data_ DRC Ebola response community feedback - community_feedback.csv';
  let categoryDefinitionURL = 'data/Data_ DRC Ebola response community feedback - category_definition.csv';
  let burdenURL = 'data/Data_ DRC Ebola response community feedback - ebola_burden_all.csv' ;
  let locationsURL = 'data/Data_ DRC Ebola response community feedback - locations.csv' ;
  let communityData, locationsData, burdenData, categoryDefinition = '';
  
  let mainChart ;
  let typesList       = [],
      categoriesList  = [],
      healthzonesList = [];

  let primeColor = '#0073b7' ;
  let dataTableData = [];

  let multiBarCharts = false;
  let switchTrend = false;

  var percentageFormat = function(d){return d + '%'; };


// -- all global vars //

  function setKeyFigures (argument) {
    //get from-to date
    fromDate = $("#from").datepicker('getDate');
    toDate = $("#to").datepicker('getDate');

    //get selected healthzone
    var selectionHZ = $('.health-zone-dropdown option:selected').text();
    var data = burdenData;
    selectionHZ = 'Beni';

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

  function setCategoryFilter (argument) {
    var selectionType ;
    argument==undefined ? selectionType= 'Rumors_beliefs_observations' : selectionType = argument;
    var dataByType = d3.nest()
        .key(function(d){ return d['type'];})
        .key(function(d){ return d['category']; })
        .entries(communityData);
    var set = [],
        cat = [];
    for (var i = 0; i < dataByType.length; i++) {
      dataByType[i].key === selectionType ? set = dataByType[i].values : '';
    }
    set.forEach( function(element, index) {
      cat.push(element.key);
    });
    categoriesList = cat;
    var dropdownCategory = d3.select(".category-dropdown")
      .selectAll("option")
      .data(categoriesList)
      .enter().append("option")
        .text(function(d){ return d; })
        .attr("value", function(d){ return d; });

    if (argument==undefined) {
      $("#categoryDropdown").multipleSelect({
        minimumCountSelected : 1,
        onClose: function(){
          updateDashoard();
        }
      });
    } else {
      // refresh dropdown options
      $("#categoryDropdown").multipleSelect('destroy')
      $("#categoryDropdown").multipleSelect({
        data: cat,
        onClose: function(){
          return updateDashoard();
          // updateDataTable();
        }
      });
      $("#categoryDropdown").multipleSelect('refresh');
    }

    $("#categoryDropdown").multipleSelect("checkAll");
  }//updateCategoryFilter


  function setFilters (argument) {
    setCategoryFilter();
    // should maybe use other data source
    communityData.forEach( function(element, index) {
      typesList.includes(element['type']) ? '': typesList.push(element['type']);
      healthzonesList.includes(element['health_zone']) ? '': healthzonesList.push(element['health_zone']);
    });

    //num categories slider
    var handle = $("#custom-handle");
    $("#categorySlider").slider({
      min: 1,
      max: categoriesList.length,
      value:5,
      create: function() {
        handle.text($(this).slider("value"));
      },
      slide: function(event, ui) {
        //$( "#amount" ).val( "$" + ui.value );
        handle.text(ui.value);
        updateDashoard();
        updateDataTable();
        
      }
    });
    $('.slider-range').find('.max').text(categoriesList.length);

    var dropdownType = d3.select(".type-dropdown")
        .selectAll("option")
        .data(typesList)
        .enter().append("option")
          .text(function(d){ return d ;})
          .attr("value", function(d){ return d; });
    $(".type-dropdown").val("Rumors_beliefs_observations");

    var dropdwonHealthZone = d3.select(".health-zone-dropdown")
        .selectAll("option")
        .data(healthzonesList)
        .enter().append("option")
          .text(function(d){ return d; })
          .attr("value", function(d){ return d; });

    $("#healthZoneDropdown").multipleSelect({
      minimumCountSelected: 1,
      onClose: function(){
        updateDashoard();
        updateDataTable();
      }
    });
    $("#healthZoneDropdown").val(["Beni"]);
    $("#healthZoneDropdown").multipleSelect("refresh");

    var miniDate = new Date(d3.min(communityData,function(d){return d['date'];}));
    var maxiDate = new Date(d3.max(communityData,function(d){return d['date'];}));
    
    var dateFormat = "yy-mm-dd";
    var from = $("#from")
        .datepicker({
          dateFormat : dateFormat,
          minDate : miniDate,
          maxDate : maxiDate
        }).on("change", function(){
          console.log("date changed");
        });
    var to = $("#to")
        .datepicker({
          dateFormat : dateFormat,
          minDate : miniDate,
          maxDate : maxiDate
        }).on("change", function(){
          updateDashoard();
          updateDataTable();
          console.log("updated")
        });
    $("#from").datepicker( "setDate" , miniDate );
    $("#to").datepicker( "setDate" , maxiDate );

  }//setFilters


  // //from date on change 
  // $('#from').datepicker().on('change', function(e){
  //   console.log("date changed")
  //   updateDashoard();
  //   updateDataTable();
  // });

  // //to date on change 
  // $('#to').on('changeDate', function(e){
  //   updateDashoard();
  //   updateDataTable();
  // });

  //filter type on change
  $('.type-dropdown').on('change', function(e){
    var select = $('.type-dropdown option:selected').text()
    setCategoryFilter(select);
    updateDashoard();
    updateDataTable();
    // slider max value should be updated accordingly
    // $("#categorySlider").slider("option", "max", 8);
  });

  //radio Trend analysis checked
  $('#trendAnalysis').change(function(d){
    $('#trendAnalysis').is(':checked') ? console.log("c est check") : console.log('c est pas check');
  })

  //get filters values and update chart accordingly 
  function updateDashoard () {
    setKeyFigures();
    mainChart===undefined ? '' : mainChart=null
    drawCharts();
    updateDataTable();
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
    var data = getCommunityFeedbackData(); // returns [x, y, z]

    if (! switchTrend) {
      if (multiBarCharts) {
        //multiBarCharts
        mainChart = c3.generate({
            bindto: '#mainChart',
            padding: { left: 250
            },
            size: { height: 300 },
            color: {
              primeColor
            },
            data: {
                x: 'x',
                columns: data[0],
                type: 'bar',
                group: data[1],
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
                y: {
                  tick: {
                    centered: false,
                    outer: false,
                    count: 5
                  }
                }
            },
            legend: { hide: 'x' },
            tooltip: {
              format: {
                value: percentageFormat
              }
            }
        });
      } else {
        // one bar chart
        mainChart = c3.generate({
            bindto: '#mainChart',
            padding: { left: 250
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
                y: {
                    centered: false,
                    outer: false,
                    count: 5
                }
            },
            legend: { hide: 'x' },
            tooltip: {
                contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
                    var $$ = this, config = $$.config,
                        titleFormat = config.tooltip_format_title || defaultTitleFormat,
                        nameFormat = config.tooltip_format_name || function (name) { return name; },
                        valueFormat = config.tooltip_format_value || defaultValueFormat,
                        text, i, title, value, name, bgcolor;
                    for (i = 0; i < d.length; i++) {
                        if (! (d[i] && (d[i].value || d[i].value === 0))) { continue; }

                        if (! text) {
                            title = titleFormat ? titleFormat(d[i].x) : d[i].x;
                            text = "<table class='" + $$.CLASS.tooltip + "'>" + (title || title === 0 ? "<tr><th colspan='2'>" + title + "</th></tr>" : "");
                        }

                        name = nameFormat(d[i].name);
                        value = valueFormat(d[i].value, d[i].ratio, d[i].id, d[i].index);
                        bgcolor = $$.levelColor ? $$.levelColor(d[i].value) : color(d[i].id);

                        text += "<tr class='" + $$.CLASS.tooltipName + "-" + d[i].id + "'>";
                        // text += "<td class='name'><span style='background-color:" + bgcolor + "'></span>" + name + "</td>";
                        // text += "<td class='value'>" + value + "</td>";
                        // text += "</tr>"; 
                    }
                    var message = categoryDefinition[title].en;
                    text += "<tr><td>" + message + "</td></tr>";
                    return text + "</table>";
                }
            }
        });
      }
    } else {
      //trend
      mainChart = c3.generate({
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

  }//drawCharts

  var sort_value = function (d1, d2) {
    if (d1.value > d2.value) return -1;
    if (d1.value < d2.value) return 1;
    return 0;
  }

  function filterByCategory(item) {
    var included = false;
    for (var i=0; i<selectionCategory.length; i++) {
      if (item['category'] == selectionCategory[i]) {
        included = true;
        break;
      }
    }
    return included;
  }

  function filterByHealthZone(item) {
    var included = false;
    for (var i=0; i<selectionHZ.length; i++) {
      if (item['health_zone'] == selectionHZ[i]) {
        included = true;
        break;
      }
    }
    return included;
  }

  var selectionCategory;
  var selectionHZ;
  function getCommunityFeedbackData () {
    //get from-to date
    fromDate = $("#from").datepicker('getDate');
    toDate = $("#to").datepicker('getDate');

    //get selected type
    var selectionType = $('.type-dropdown option:selected').text();

    //get selected category
    selectionCategory = $('.category-dropdown').val();
    //(let's cheat)
    selectionCategory===null ? selectionCategory=categoriesList : '';

    //get selected healthzone
    selectionHZ = $('.health-zone-dropdown').val();

    var data = communityData;
    data = data.filter(function(d){ return d['type'] == selectionType; });

    data = data.filter(function(d){
      var dt = new Date(d['date']) ;
      return fromDate <= dt <= toDate ;
    });

    data = data.filter(filterByCategory);

    data = data.filter(filterByHealthZone);

    multiBarCharts = selectionHZ.length > 1 ? true : false;
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

    var numCategory    = $("#categorySlider").slider("value");
    var xCategoryArr   = ['x'],
        yCategoryArr   = [];

    if (! multiBarCharts) {
      total = d3.sum(dataByMetric[0].values, function(d){ return d['value']; });
      dataByMetric[0].values.forEach( function(element, index) {
        var pct = Number(((element['value'] / total) * 100).toFixed(2));
        element['value'] = pct;
      });
      dataByMetric[0].values.sort(sort_value);
      yCategoryArr[0] = selectionHZ;
      for (var i = 0; i <= numCategory-1; i++) {
        xCategoryArr.push(dataByMetric[0].values[i].key);
        yCategoryArr.push(parseFloat(dataByMetric[0].values[i].value));
      }
    return [xCategoryArr, yCategoryArr];
    } else {
      for (var i = 0; i <= numCategory-1; i++) {
        selectionCategory[i] != undefined ? xCategoryArr.push(selectionCategory[i]) : '';
      }
      yCategoryArr.push(xCategoryArr);
      var dataNames = [];
      dataByMetric.forEach( function(element, index) {
        dataNames.push(element.key);
        total = d3.sum(element.values, function(d){ return d['value']; });
        element.values.forEach( function(element, index) {
          var pct = Number(((element['value'] / total) * 100).toFixed(2));
          element['value'] = pct;
        });
        element.values.sort(sort_value);
        var arr = [];
        arr[0] = element.key;
        for (var i = 0; i < xCategoryArr.length; i++) {
          var val = 0;
          element.values.forEach( function(ele, ind) {
            ele.key===xCategoryArr[i] ? val= ele.value : '';
          });
          arr.push(val);
        }
        yCategoryArr.push(arr);
      });
      return [yCategoryArr, dataNames];
    }

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
    map.setView([-0.461, 29.530], 7); //-2.712/23.244 -4.579, 21.887
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
      d3.csv(locationsURL),
      d3.csv(categoryDefinitionURL)
    ]).then(function(data){
      communityData = data[0];
      burdenData = data[1];
      locationsData = data[2];
      categoryDefinition = {};
      data[3].forEach( function(element, index) {
        categoryDefinition[element['category']] = {'en': element['category_definition'], 'fr': element['category_definition_fr']};
      });
      setFilters();
      setKeyFigures();
      drawCharts();
      drawTable();
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