// Load the data
const socialMedia = d3.csv("socialMedia.csv");

// Once the data is loaded, proceed with plotting
socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Define the dimensions and margins for the SVG
const margin = { top: 40, right: 30, bottom: 50, left: 60 },
      width  = 600 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;


    // Create the SVG container
const svg = d3.select("#boxplot")
  .append("svg")
  .attr("width",  width  + margin.left + margin.right)
  .attr("height", height + margin.top  + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);


    // Set up scales for x and y axes
const platforms = [...new Set(data.map(d => d.Platform))];

// xScale: a band scale for the 4 platforms
const xScale = d3.scaleBand()
  .domain(platforms)
  .range([0, width])
  .padding(0.2);

// yScale: a linear scale for the Likes
const yScale = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.Likes)]) // from 0 to max Likes
  .range([height, 0])
  .nice();

    // You can use the range 0 to 1000 for the number of Likes, or if you want, you can use
    // d3.min(data, d => d.Likes) to achieve the min value and 
    // d3.max(data, d => d.Likes) to achieve the max value
    // For the domain of the xscale, you can list all four platforms or use
    // [...new Set(data.map(d => d.Platform))] to achieve a unique list of the platform
    

    // Add scales     
svg.append("g")
   .attr("transform", `translate(0, ${height})`)
   .call(d3.axisBottom(xScale));

svg.append("g")
   .call(d3.axisLeft(yScale));

//  Add axis labels
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
    

    // Add y-axis label
    

    //  Define a function to compute boxplot statistics (q1, median, q3, etc.)
const rollupFunction = function(groupData) {
  const values = groupData.map(d => d.Likes).sort(d3.ascending);
  const q1 = d3.quantile(values, 0.25);
  const median = d3.quantile(values, 0.5);
  const q3 = d3.quantile(values, 0.75);
  const interQuantileRange = q3 - q1;
  const min = d3.min(values);
  const max = d3.max(values);
  return { q1, median, q3, interQuantileRange, min, max };
};


    const quantilesByGroups = d3.rollup(data, rollupFunction, d => d.Platform);

    quantilesByGroups.forEach((quantiles, Platform) => {
        const x = xScale(Platform);
        const boxWidth = xScale.bandwidth();

        // Draw vertical lines
     svg.append("line")
        .attr("x1", x + boxWidth / 2)
        .attr("x2", x + boxWidth / 2)
        .attr("y1", yScale(quantiles.min))
        .attr("y2", yScale(quantiles.max))
        .attr("stroke", "black");   

        // Draw box
      svg.append("rect")
        .attr("x", x)
        .attr("y", yScale(quantiles.q3))
        .attr("width", boxWidth)
        .attr("height", yScale(quantiles.q1) - yScale(quantiles.q3))
        .attr("stroke", "black")
        .attr("fill", "#69b3a2");
  

        // Draw median line
      svg.append("line")
        .attr("x1", x)
        .attr("x2", x + boxWidth)
        .attr("y1", yScale(quantiles.median))
        .attr("y2", yScale(quantiles.median))
        .attr("stroke", "black");  
    });
});

// Prepare you data and load the data again. 
// This data should contains three columns, platform, post type and average number of likes. 
const socialMediaAvg = d3.csv("socialMediaAvg.csv");

socialMediaAvg.then(function(data) {
    // Convert string values to numbers
    data.forEach(d => {
        d.AvgLikes = +d.AvgLikes; // Make sure to match your CSV column name
    });

    // Define the dimensions and margins for the SVG
    const margin = { top: 40, right: 30, bottom: 50, left: 60 },
          width  = 600 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#barplot")
      .append("svg")
      .attr("width",  width  + margin.left + margin.right)
      .attr("height", height + margin.top  + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Define four scales
    // Scale x0 is for the platform, which divide the whole scale into 4 parts
    // Scale x1 is for the post type, which divide each bandwidth of the previous x0 scale into three part for each post type
    // Recommend to add more spaces for the y scale for the legend
    // Also need a color scale for the post type

    const x0 = d3.scaleBand()
      .domain(platforms)
      .range([0, width])
      .padding(0.2);
      

    const x1 = d3.scaleBand()
      .domain(postTypes)
      .range([0, x0.bandwidth()])
      .padding(0.05);      

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.AvgLikes)])
      .range([height, 0])
      .nice();
      

    const color = d3.scaleOrdinal()
      .domain(postTypes)
      .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"]);    
         
    // Add scales x0 and y     
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x0));

    svg.append("g")
      .call(d3.axisLeft(y));

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


  // Group container for bars
    const barGroups = svg.selectAll(".barGroup")
      .data(platforms)
      .enter()
      .append("g")
      .attr("class", "barGroup")
      .attr("transform", d => `translate(${x0(d)}, 0)`);

  // Draw bars
    barGroups.selectAll("rect")
      .data(d => data.filter(item => item.Platform === d))
      .enter()
      .append("rect")
      .attr("x", d => x1(d.PostType))
      .attr("y", d => y(d.AvgLikes))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - y(d.AvgLikes))
      .attr("fill", d => color(d.PostType));
      

    // Add the legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 150}, ${margin.top - 30})`);

    postTypes.forEach((type, i) => {
      // Draw a small colored square
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(type));

      // Label
      legend.append("text")
        .attr("x", 20)
        .attr("y", i * 20 + 12)
        .text(type)
        .attr("alignment-baseline", "middle");
    });
});

// Prepare you data and load the data again. 
// This data should contains two columns, date (3/1-3/7) and average number of likes. 

const socialMediaTime = d3.csv("socialMediaTime.csv");

socialMediaTime.then(function(data) {
    // Convert string values to numbers
    data.forEach(d => {
        d.AvgLikes = +d.AvgLikes; 
    });

    // Define the dimensions and margins for the SVG
    const margin = { top: 40, right: 30, bottom: 50, left: 60 },
          width  = 600 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#lineplot")
      .append("svg")
      .attr("width",  width  + margin.left + margin.right)
      .attr("height", height + margin.top  + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Set up scales for x and y axes  
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.date))
      .range([0, width])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.AvgLikes)])
      .range([height, 0])
      .nice();

    // 4) Add the axes
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale))
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

    // 5) Create a line generator
    const lineGenerator = d3.line()
      .x(d => xScale(d.date) + (xScale.bandwidth ? xScale.bandwidth() / 2 : 0))
      .y(d => yScale(d.AvgLikes))
      .curve(d3.curveNatural); // Use curveNatural for a smooth line

    // 6) Draw the line path
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#ff7f0e")
      .attr("stroke-width", 2)
      .attr("d", lineGenerator);

    svg.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.date) + (xScale.bandwidth ? xScale.bandwidth() / 2 : 0))
      .attr("cy", d => yScale(d.AvgLikes))
      .attr("r", 4)
      .attr("fill", "#ff7f0e");
});
