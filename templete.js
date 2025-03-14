d3.csv("socialMedia.csv").then(function(data) {
  // Convert string values to numbers
  data.forEach(function(d) {
    d.Likes = +d.Likes;
  });

  // Define dimensions and margins for the SVG
  const margin = { top: 40, right: 30, bottom: 50, left: 60 },
        width  = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  // Create the SVG container in the div with id "boxplot"
  const svg = d3.select("#boxplot")
    .append("svg")
    .attr("width",  width  + margin.left + margin.right)
    .attr("height", height + margin.top  + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Identify unique platforms from the data
  const platforms = [...new Set(data.map(d => d.Platform))];

  // Create scales: x for platforms, y for Likes
  const xScale = d3.scaleBand()
    .domain(platforms)
    .range([0, width])
    .padding(0.2);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.Likes)])
    .range([height, 0])
    .nice();

  // Add the x-axis and y-axis to the SVG
  svg.append("g")
     .attr("transform", `translate(0, ${height})`)
     .call(d3.axisBottom(xScale));
  svg.append("g")
     .call(d3.axisLeft(yScale));

  // Optional: Add axis labels
  svg.append("text")
     .attr("x", width / 2)
     .attr("y", height + margin.bottom - 5)
     .style("text-anchor", "middle")
     .text("Platform");
  svg.append("text")
     .attr("transform", "rotate(-90)")
     .attr("x", -height / 2)
     .attr("y", -margin.left + 15)
     .style("text-anchor", "middle")
     .text("Likes");

  // Define a function to compute boxplot statistics for each platform
  function rollupFunction(groupData) {
    const values = groupData.map(d => d.Likes).sort(d3.ascending);
    const q1 = d3.quantile(values, 0.25);
    const median = d3.quantile(values, 0.5);
    const q3 = d3.quantile(values, 0.75);
    const min = d3.min(values);
    const max = d3.max(values);
    return { q1, median, q3, min, max };
  }

  // Group the data by platform and compute quartile statistics
  const quartilesByPlatform = d3.rollup(data, rollupFunction, d => d.Platform);

  // For each platform, draw the boxplot (vertical line, rectangle, median line)
  quartilesByPlatform.forEach((quartiles, platform) => {
    const x = xScale(platform);
    const boxWidth = xScale.bandwidth();

    // Draw vertical line from min to max
    svg.append("line")
      .attr("x1", x + boxWidth / 2)
      .attr("x2", x + boxWidth / 2)
      .attr("y1", yScale(quartiles.min))
      .attr("y2", yScale(quartiles.max))
      .attr("stroke", "black");

    // Draw the rectangle (box) from q3 to q1
    svg.append("rect")
      .attr("x", x)
      .attr("y", yScale(quartiles.q3))
      .attr("width", boxWidth)
      .attr("height", yScale(quartiles.q1) - yScale(quartiles.q3))
      .attr("stroke", "black")
      .attr("fill", "#69b3a2");

    // Draw horizontal line for the median
    svg.append("line")
      .attr("x1", x)
      .attr("x2", x + boxWidth)
      .attr("y1", yScale(quartiles.median))
      .attr("y2", yScale(quartiles.median))
      .attr("stroke", "black");
  });
});

// PART 2.2: SIDE-BY-SIDE BAR PLOT
d3.csv("socialMediaAvg.csv").then(function(data) {
  // Convert string values to numbers
  data.forEach(d => {
    d.AvgLikes = +d.AvgLikes;
  });

  // Increase right margin to leave room for legend
  const margin = { top: 40, right: 120, bottom: 50, left: 60 },
        width  = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  // Create the SVG container
  const svg = d3.select("#barplot")
    .append("svg")
    .attr("width",  width  + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Identify unique platforms and post types
  const platforms = [...new Set(data.map(d => d.Platform))];
  const postTypes = [...new Set(data.map(d => d.PostType))];

  // x0 scale for platforms
  const x0 = d3.scaleBand()
    .domain(platforms)
    .range([0, width])
    .padding(0.2);

  // x1 scale for post types
  const x1 = d3.scaleBand()
    .domain(postTypes)
    .range([0, x0.bandwidth()])
    .padding(0.05);

  // y scale for average likes
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.AvgLikes)])
    .range([height, 0])
    .nice();

  // color scale
  const color = d3.scaleOrdinal()
    .domain(postTypes)
    .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"]);

  // Add axes
  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x0));
  svg.append("g")
    .call(d3.axisLeft(y));

  // Axis labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 5)
    .style("text-anchor", "middle")
    .text("Platform");
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .style("text-anchor", "middle")
    .text("Average Likes");

  // Draw grouped bars
  const barGroups = svg.selectAll(".barGroup")
    .data(platforms)
    .enter()
    .append("g")
    .attr("class", "barGroup")
    .attr("transform", d => `translate(${x0(d)}, 0)`);

  barGroups.selectAll("rect")
    .data(d => data.filter(item => item.Platform === d))
    .enter()
    .append("rect")
    .attr("x", d => x1(d.PostType))
    .attr("y", d => y(d.AvgLikes))
    .attr("width", x1.bandwidth())
    .attr("height", d => height - y(d.AvgLikes))
    .attr("fill", d => color(d.PostType));

  // Position legend so it doesn't overlap
  const legend = svg.append("g")
    .attr("transform", `translate(${width + 10}, 20)`);

  postTypes.forEach((type, i) => {
    // small colored square
    legend.append("rect")
      .attr("x", 0)
      .attr("y", i * 20)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color(type));

    // text label
    legend.append("text")
      .attr("x", 20)
      .attr("y", i * 20 + 12)
      .text(type)
      .attr("alignment-baseline", "middle");
  });
});

/*****************************************************
 * PART 2.3: LINE PLOT
 *****************************************************/
d3.csv("socialMediaTime.csv").then(function(data) {
  // 1) Convert AvgLikes to numeric
  data.forEach(d => {
    d.AvgLikes = +d.AvgLikes;
  });

  // 2) Parse "3/1/2024 (Friday)" into a real Date object
  // EXACT format string must match your CSV
  const parseDate = d3.timeParse("%m/%d/%Y (%A)");

  data.forEach(d => {
    d.parsedDate = parseDate(d.Date); 
    // If parse fails, d.parsedDate will be null
  });

  // 3) Dimensions
  const margin = { top: 40, right: 30, bottom: 50, left: 60 },
        width  = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  // 4) Create the SVG container in the div with id="lineplot"
  const svg = d3.select("#lineplot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // 5) Create a time scale for the x-axis
  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.parsedDate)) // from earliest to latest date
    .range([0, width]);

  // 6) Create a linear scale for AvgLikes
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.AvgLikes)])
    .range([height, 0])
    .nice();

  // 7) Create and add the axes
  // We'll format the x-axis as month/day
  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.timeFormat("%m/%d")); // e.g., "03/01"
    // You can also use "%b %d" for "Mar 01"

  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  svg.append("g")
    .call(d3.axisLeft(yScale));

  // (Optional) Axis labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 5)
    .style("text-anchor", "middle")
    .text("Date");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .style("text-anchor", "middle")
    .text("Average Likes");

  // 8) Create a line generator
  const lineGenerator = d3.line()
    .x(d => xScale(d.parsedDate))
    .y(d => yScale(d.AvgLikes))
    .curve(d3.curveNatural);

  // 9) Draw the line path
  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#ff7f0e")
    .attr("stroke-width", 2)
    .attr("d", lineGenerator);

  // 10) (Optional) Draw circles at each data point
  svg.selectAll(".dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => xScale(d.parsedDate))
    .attr("cy", d => yScale(d.AvgLikes))
    .attr("r", 4)
    .attr("fill", "#ff7f0e");
});

