/** Set size */

const margin = {
  top: 100,
  right: 20,
  bottom: 100,
  left: 95,
};

const parentWidth = 1000;
const parentHeight = 500;

const width = parentWidth - margin.left - margin.right;
const height = parentHeight - margin.top - margin.bottom;

/** X and Y scales */

const xScale = d3.scaleBand().range([0, width]);
// domain will set in data loading

const yScale = d3.scaleBand().range([0, height]);
// domain will set in data loading

/** D3 containers */

// Map

const graph = d3
  .select("body")
  .append("div")
  .attr("class", "container")
  .append("svg")
  .attr("id", "graph")
  .attr("class", "graph")
  .attr("width", parentWidth)
  .attr("height", parentHeight)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Axis

const xAxis = graph
  .append("g")
  .attr("id", "x-axis")
  .attr("class", "axis x-axis")
  .attr("transform", `translate(0, ${height})`);
// call will set in data loading

const yAxis = graph
  .append("g")
  .attr("id", "y-axis")
  .attr("class", "axis y-axis");
// call will set in data loading

// Axis labels

const xLabel = xAxis
  .append("text")
  .attr("class", "label")
  .attr("x", width)
  .attr("y", 50)
  .text("Years");

const yLabel = yAxis
  .append("text")
  .attr("class", "label")
  .attr("transform", "rotate(-90)")
  .attr("x", 0)
  .attr("y", -65)
  .text("Months");

// Headers

const title = graph
  .append("text")
  .attr("id", "title")
  .attr("class", "title")
  .attr("x", width / 2)
  .attr("y", -margin.top / 2 - 5)
  .text("Monthly Global Land-Surface Temperature");

const subtitle = graph
  .append("text")
  .attr("id", "description")
  .attr("class", "subtitle")
  .attr("x", width / 2)
  .attr("y", -margin.top / 2 + 30)
// Text will set in data loading

// Legend

const legendTop = height + 50

const legend = graph
  .append("g")
  .attr("id", "legend")
  .attr("class", "legend")
  .attr("transform", `translate(0,${legendTop})`);

// Tooltip

const tooltip = d3
  .select("body")
  .append("div")
  .attr("id", "tooltip")
  .attr("class", "tooltip")
  ;

/** Load data */

const JSONFile =
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

d3.json(JSONFile)
  .then((data) => {

    /** Parse data */

    const baseTemp = data.baseTemperature;

    const dataset = data.monthlyVariance.map(d => (
      //{...d, temperature: parseFloat((baseTemp + d.variance).toFixed(3))}
      { ...d, temperature: baseTemp + d.variance }
    ));

    const [minYear, maxYear] = d3.extent(dataset, (d) => d.year);
    const [minTemp, maxTemp] = d3.extent(dataset, (d) => d.temperature);

    /** Set subtitle text */

    subtitle
      .text(`Base temperature: ${baseTemp}℃ (${minYear} to ${maxYear})`);

    /** Color Brewer */

    const numOfColors = 10;

    const colorRange = d3.schemeRdYlBu[numOfColors].reverse();

    const colorScale = d3
      .scaleQuantize()
      .domain([minTemp, maxTemp])
      .range(colorRange);

    /** Set scale domain */

    xScale.domain(dataset.map(d => d.year));
    yScale.domain(dataset.map(d => d.month));

    /** Set axis */

    const monthNumToName = (monthNum) => {
      const formatMonth = d3.timeFormat('%B');
      // Note: setUTCMonth expects values from 0 to 11
      return formatMonth(new Date().setUTCMonth(monthNum - 1));
    };

    xAxis.call(d3
      .axisBottom(xScale)
      .tickValues(
        // Each x-axis tick for a 10 years period
        xScale.domain().filter(y => y % 10 === 0)
      )
    );

    yAxis.call(d3
      .axisLeft(yScale)
      .tickFormat(m => monthNumToName(m))
    );

    /** Set map */

    const cell = graph
      .selectAll("rect")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("data-year", d => d.year)
      /* 
        data-month:
        Range to pass the test is 0 - 11.
        Range of month in JSON File is 1 - 12.
        ¿Is this a bug? 
      */
      .attr("data-month", d => d.month - 1) // -1 to pass user story #8
      .attr("data-temp", d => d.temperature)
      .attr("x", (d) => xScale(d.year))
      .attr("y", (d) => yScale(d.month))
      .attr("width", (d) => xScale.bandwidth(d.year))
      .attr("height", (d) => yScale.bandwidth(d.month))
      .style("fill", (d) => colorScale(d.temperature))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(300).style("opacity", 0.8);

        const tooltipInnerHtml = (item) => (
          `<span class="tt-year">${item.year}</span> - 
           <span class="tt-month">${monthNumToName(item.month)}</span>
           <br />
           <span class="tt-temperature">${item.temperature.toFixed(1)}ºC</span>
           <br />
           <span class="tt-variance">${item.variance.toFixed(1)}ºC</span>
            <hr class="tt-color" 
              style="border-color: ${colorScale(d.temperature)}"/>`
        );

        const [xTooltipMargin, yTooltipMargin] = [20, -40];

        tooltip
          .style("top", (event.pageY || event.y) + yTooltipMargin + "px")
          .style("left", (event.pageX || event.x) + xTooltipMargin + "px")
          .attr("data-year", d.year)
          .html(tooltipInnerHtml(d));
      })
      .on("mouseout", () => {
        tooltip.transition().duration(300).style("opacity", 0);
      });

    /** Set Legend */

    const legendItemWidth = 20;
    const legendWidth = colorRange.length * legendItemWidth;

    legend
      .selectAll("rect")
      .data(colorRange)
      .enter()
      .append("rect")
      .classed("legend-item", true)
      .style("fill", d => d)
      .attr("x", (d, i) => (legendItemWidth * i))
      .attr("y", 0)
      .attr("width", legendItemWidth)
      .attr("height", legendItemWidth);

    // Legend scale

    const legendXScale = d3
      .scaleLinear()
      .domain([minTemp, maxTemp])
      .range([0, legendWidth]);

    // Legend axis

    const createDomain = (min, max, length) => {
      const base = min;
      const step = (max - min) / length;
      const array = [base];
      for (let i = 0; i <= length; i++) {
        array.push(base + i * step);
      }
      return array;
    };

    const legendXDomain = createDomain(minTemp, maxTemp, colorRange.length);

    const legendXAxis = graph
      .append("g")
      .attr("id", "legend-x-axis")
      .attr("class", "axis legend-x-axis")
      .attr("transform", `translate(0, ${legendTop + legendItemWidth})`);

    legendXAxis.call(d3
      .axisBottom(legendXScale)
      .tickValues(legendXDomain)
      .tickFormat(d3.format('.1f'))
    );

  })
  .catch((err) => console.error(err));  
