var width = 800,
  height = 500;

var color = d3.scale.category10();

var force = d3.layout.force()
  .charge(-120)
  .linkDistance(function(d) {
    return 200 + Math.sqrt(5000 / d.value);
  })
  .linkStrength(0.1)
  .size([width, height]);

var svg = d3.select("#svgContainer").append("svg")
  .attr("width", width)
  .attr("height", height);

var jsonData = {
  nodes: [],
  links: []
}

var threshold = 500;

var ITEM_PREFIX = 'item_';

$("document").ready(function() {

  $('form').submit(function(event) {
    event.preventDefault();
  })

  $('#threshold').change(function() {
    threshold = parseInt($('#threshold').val());
    update();
  });

  $("#datafile").change(function() {
    var file = document.getElementById('datafile').files[0];
    Papa.parse(file, {
      download: true,
      header: true,
      step: function(row) {
        var name = row['data']['0']['id'];
        var items = row['data']['0'];
        var itemCount = Object.keys(row['data']['0']).length - 1;

        var itemsOne = {};

        for (var i = 0; i < itemCount; i++) {
          if (items[ITEM_PREFIX + i] == "1") {
            itemsOne[i] = 1;
          }
        }

        for (var i in itemsOne) {
          if (!jsonData['nodes'][i]) {
            jsonData['nodes'][i] = {
              name: ITEM_PREFIX + i,
              group: 1,
              links: {},
              id: i,
            }
          }

          for (var j in itemsOne) {
            if (j != i) {
              if (jsonData['nodes'][i]['links'][j]) {
                jsonData['nodes'][i]['links'][j] ++;
              } else {
                jsonData['nodes'][i]['links'][j] = 1;
              }
            }
          }
        }

      },
      complete: function() {
        update();
        pageRank();
        console.log(JSON.stringify(jsonData, null, 2));
      }
    });
  });
});

function update() {
  jsonData['links'] = [];

  for (var source in jsonData['nodes']) {
    for (var target in jsonData['nodes'][source]['links']) {
      var value = jsonData['nodes'][source]['links'][target];

      if (value > threshold) {
        jsonData['links'].push({
          source: jsonData['nodes'][source],
          target: jsonData['nodes'][target],
          value: value
        });
      }
    }
  }
  updateWithJson(jsonData);
}

function updateWithJson(jsonData) {
  svg.remove();
  svg = d3.select("#svgContainer").append("svg")
    .attr("width", width)
    .attr("height", height);

  var graph = jsonData;

  force
    .nodes(graph.nodes)
    .links(graph.links)
    .start();

  var link = svg.selectAll(".link")
    .data(graph.links)
    .enter().append("line")
    .attr("class", "link")
    .style("stroke-width", function(d) {
      return Math.sqrt(d.value / 750);
    });

  // Create the groups under svg
  var gnodes = svg.selectAll('g.gnode')
    .data(graph.nodes)
    .enter()
    .append('g')
    .classed('gnode', true).call(force.drag);


  // Add one circle in each group
  var node = gnodes.append("circle")
    .attr("class", "node")
    .attr("r", 10)
    .attr("nodeid", function(d) {
      return d.id;
    })
    .style("fill", function(d) {
      return color(d.group);
    });
  node.on("click", toggleColor);

  // Append the labels to each group
  var labels = gnodes.append("text")
    .text(function(d) {
      return d.name;
    }).style("font-size", "10px");

  force.on("tick", function() {
    // Update the links
    link.attr("x1", function(d) {
        return d.source.x;
      })
      .attr("y1", function(d) {
        return d.source.y;
      })
      .attr("x2", function(d) {
        return d.target.x;
      })
      .attr("y2", function(d) {
        return d.target.y;
      });

    // Translate the groups
    gnodes.attr("transform", function(d) {
      return 'translate(' + [d.x, d.y] + ')';
    });
  });
}

function toggleColor() {
  d3.selectAll("circle").style("fill", color(1));
  var id = d3.select(this).attr("nodeid");
  currentSelectedId = id;
  d3.select(this).style("fill", color(2));

  var links = jsonData['nodes'][id]['links'];
  for (var link in links) {
    if (link != id) {
      var value = jsonData['nodes'][id]['links'][link];
      if (value > threshold) {
        d3.select("[nodeid='" + link + "']").style("fill", color(3));
      }
    }
  }
}

function pageRank() {
  var nodeScores = [];

  for (var i = 0; i < jsonData['nodes'].length; i++) {
    var nodeScoreRow = zeros(jsonData['nodes'].length, 0);

    for (var link in jsonData['nodes'][i]['links']) {
      nodeScoreRow[link] = jsonData['nodes'][i]['links'][link];
    }

    // nodeScoreRow = normalize(nodeScoreRow);

    nodeScores.push(nodeScoreRow);
  }

  var eigen = zeros(jsonData['nodes'].length, 1);

  for (var h = 0; h < 20; h++) {
    var w = zeros(jsonData['nodes'].length, 0);

    for (var i = 0; i < jsonData['nodes'].length; i++) {
      for (var j = 0; j < jsonData['nodes'].length; j++) {
        w[i] = w[i] + (nodeScores[i][j] * eigen[j]);
      }
    }
    eigen = normalize(w);
  }

  // sort bags according to eigen value
  var eigenCounts = [];

  for (var i = 0; i < jsonData['nodes'].length; i++) {
    var eigenObject = {
      weight: eigen[i],
      id: i
    }
    eigenCounts.push(eigenObject);
  }
  eigenCounts.sort(function(a, b) {
    return b['weight'] - a['weight'];
  });


  $('#pageranking').append("<tr><th>Rank</th><th>Name</th><th>Eigenvalue</th></tr>");

  eigenCounts.forEach(function(elem, i) {
    var table = $('#pageranking');
    table.append("<tr><td><b>" + (i+1) + "</b></td><td>" + ITEM_PREFIX + elem['id'] + "</td><td>" + elem['weight'].toFixed(4) + "</td></tr>");
  });

  return eigenCounts;
}

function normalize(array) {
  var length = 0;

  for (var i = 0; i < array.length; i++) {
    length += array[i] * array[i];
  }

  length = Math.sqrt(length);

  for (var i = 0; i < array.length; i++) {
    array[i] = array[i] / length;
  }

  return array;
}

function zeros(length, value) {
  var array = [];

  for (var i = 0; i < length; i++) {
    array.push(value);
  }

  return array;
}