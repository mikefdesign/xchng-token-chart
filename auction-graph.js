var wei = 1e18;
var totalIssued;
var startTime,
    endTime,
    maxTime;
var chart = {},
    chartData = {},
    data;
var pollIntervalId,
    updateIntervalId;
var clicked;

function getCurrentPriceAt(d) {
    return getCurrentPrice(data.status.price_start, data.status.price_constant, data.status.price_exponent, (d.getTime() - startTime.getTime()) / 1e3) / wei;
}

var verticalLinePlugin = {
    renderVerticalLine: function(chartInstance, line) {
        // line = {x: number, top: number, bottom: number, color: string, dashed:
        // boolean}
        if (!isNaN(line)) {
            line = {
                x: line
            };
        } else {
            line = $.extend({}, line);
        }
        var yScale = chart.scales[
                chart
                .getDatasetMeta(0)
                .yAxisID
            ],
            xScale = chart.scales[
                chart
                .getDatasetMeta(0)
                .xAxisID
            ];
        line.x = xScale.getPixelForValue(line.x);
        if (line.top === undefined) {
            line.top = yScale.top;
        } else {
            line.top = yScale.getPixelForValue(line.top);
        }
        if (line.bottom === undefined) {
            line.bottom = yScale.bottom;
        } else {
            line.bottom = yScale.getPixelForValue(line.bottom);
        }
        if (!line.color) {
            line.color = 'white';
        }
        var context = chartInstance.chart.ctx;
        context.save();

        // render vertical line
        context.beginPath();
        context.strokeStyle = line.color;
        if (line.dashed) {
            context.setLineDash([5, 5]);
        }
        context.moveTo(line.x, line.top);
        context.lineTo(line.x, line.bottom);
        context.stroke();
        context.restore();

        // write label context.fillStyle = "#ff0000"; context.textAlign = 'center';
        // context.fillText('MY TEXT', lineLeftOffset, (scale.bottom - scale.top) / 2 +
        // scale.top);
    },

    afterDatasetsDraw: function(chart, easing) {
        if (chart.config.vLine && chart.config.vLine.push) {
            for (var i = 0; i < chart.config.vLine.length; ++i) {
                var line = chart.config.vLine[i];
                this.renderVerticalLine(chart, line);
            }
        } else if (chart.config.vLine !== undefined && !isNaN(chart.config.vLine)) {
            this.renderVerticalLine(chart, chart.config.vLine);
        }
    }
};

Chart
    .plugins
    .register(verticalLinePlugin);

var backgroundColorPlugin = {
    beforeDraw: function(chartInstance) {
        var ctx = chartInstance.chart.ctx;
        ctx.fillStyle = "#252A34";
        ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
    }
};

Chart
    .plugins
    .register(backgroundColorPlugin);

function drawGraph() {
    var ctx = $('#auction-graph');
    chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // title: {   display: true,   text: 'Chart.js Line Chart - Logarithmic' },
            legend: {
                labels: {
                    fontColor: 'white',
                    fontSize: 16,
                    boxWidth: 20,
                    filter: function(item, data) {
                        return data.datasets[item.datasetIndex].legend !== false;
                    }
                }
            },
            tooltips: {
                mode: 'nearest',
                position: 'nearest',
                intersect: false,
                backgroundColor: 'rgba(163, 163, 163, 0.8)',
                callbacks: {
                    footer: function(tooltipItem, data) {
                        return 'Click to set price alert'
                    },
                    label: function(tooltipItem, data) {
                        var label = data.datasets[tooltipItem.datasetIndex].label;
                        var y = tooltipItem
                            .yLabel
                            .toLocaleString('en', { maximumFractionDigits: 2 });
                        var price = (tooltipItem.yLabel / totalIssued).toLocaleString('en', { maximumFractionDigits: 7 });
                        return [
                            label + ': ' + y,
                            'Price (ETH/RDN): ' + price
                        ];
                    }
                }
            },
            scales: {
                xAxes: [{
                    display: true,
                    type: 'time',
                    time: {
                        //unit: 'day', unitStepSize: 1,
                        tooltipFormat: 'lll',
                        min: startTime
                    },
                    ticks: {
                        fontColor: 'white', // this here
                    },
                    gridLines: {
                        color: 'rgba(255, 255, 255, 0.2)'
                    }
                }],
                yAxes: [{
                    id: 'fundingTarget',
                    display: true,
                    type: 'logarithmic',
                    position: 'left',
                    scaleLabel: {
                        display: true,
                        labelString: 'Total ETH amount [log]',
                        lineHeight: 2,
                        fontColor: 'white',
                        fontSize: 15,
                        padding: 4
                    },
                    ticks: {
                        fontColor: 'white',
                        min: 0.9999,
                        max: 1.1e8,
                        autoSkip: false,
                        callback: function(label) {
                            var digits = label
                                .toString()
                                .length;
                            if (label % 1 !== 0) {
                                return label
                            } else if (digits >= 7) {
                                return label / 1000000 + ' M';
                            } else if (digits >= 4) {
                                return label / 1000 + ' K';
                            } else {
                                return label;
                            }
                        }
                    },
                    gridLines: {
                        color: '#FFFFFF22'
                    },
                    afterBuildTicks: function(lineChart) {
                        lineChart.ticks = [
                            1,
                            1e1,
                            1e2,
                            1e3,
                            1e4,
                            1e5,
                            1e6,
                            1e7,
                            1e8
                        ];
                    },
                    beforeUpdate: function(oScale) {
                        return;
                    }
                }, {
                    id: 'price',
                    display: true,
                    type: 'logarithmic',
                    position: 'right',
                    scaleLabel: {
                        display: true,
                        labelString: 'Price (ETH/RDN) [log]',
                        lineHeight: 2,
                        fontColor: 'white',
                        fontSize: 15,
                        padding: 4
                    },
                    ticks: {
                        fontColor: 'white',
                        min: 1.9998e-8,
                        max: 2.2,
                        autoSkip: false,
                        callback: function(label) {
                            return label;
                        }
                    },
                    afterBuildTicks: function(lineChart) {
                        lineChart.ticks = [
                            2e-8,
                            2e-7,
                            2e-6,
                            2e-5,
                            2e-4,
                            2e-3,
                            2e-2,
                            2e-1,
                            2
                        ];
                    },
                    beforeUpdate: function(oScale) {
                        return;
                    }
                }]
            }
        }
    });

    ctx.click(function($event) {
        var pos = Chart
            .helpers
            .getRelativePosition($event, chart);
        var d = chart
            .scales['x-axis-0']
            .getValueForPixel(pos.x)
            .toDate();
        var val = getCurrentPriceAt(d) * totalIssued;
        console.log('$', d, val);
        clicked = {
            x: d,
            y: val
        };
        setAlertsValue();
        updateData(data);
    });
}

function getPriceCurve(start, end, step) {
    var target = [];
    var i = start;
    while (i < end) {
        target.push({
            x: i,
            y: getCurrentPriceAt(i) * totalIssued
        });
        i = new Date(i.getTime() + step);
    }
    target.push({
        x: end,
        y: getCurrentPriceAt(end) * totalIssued
    });
    return target;
}

// generates data for static funding target graph
function getInitialData() {
    $.when($.getJSON('static.json'), $.getJSON('status.json', {
            ts: '' + Date.now()
        }))
        .done(function(staticRes, statusRes) {
            $(window).trigger('resize');
            data = statusRes[0];
            var staticData = staticRes[0],
                statusData = data.status;

            if (statusData['auction_contract_address']) {
                updateAuctionAddress(statusData['auction_contract_address']);
            }

            totalIssued = staticData.tokensOffered;
            startTime = new Date(statusData.start_time * 1000);
            endTime = new Date((staticData.endDate || (statusData.start_time + 90 * 86.4e3)) * 1000);
            maxTime = endTime;

            var fundingTargetData = getPriceCurve(startTime, endTime, 3.6e6, statusData);

            chartData = {
                datasets: [{
                    yAxisID: 'fundingTarget',
                    label: 'Implied Value of Offered Supply (ETH)',
                    borderWidth: 1.5,
                    borderColor: '#08D9D6',
                    data: fundingTargetData,
                    fill: false,
                    radius: 0
                }, {
                    yAxisID: 'fundingTarget',
                    label: 'ETH Sent to Auction',
                    borderWidth: 1.5,
                    borderColor: 'rgb(234, 234, 234)',
                    backgroundColor: 'rgba(234, 234, 234, 0.25)',
                    data: [],
                    lineTension: 0,
                    radius: 0
                }, {
                    yAxisID: 'fundingTarget',
                    label: 'Days To Target',
                    borderColor: 'white',
                    borderDash: [
                        5, 5
                    ],
                    borderWidth: 1,
                    fill: false,
                    legend: false,
                    data: [],
                    lineTension: 0,
                    radius: 0
                }]
            };
            drawGraph();
            updateDataAPI();
            pollIntervalId = setInterval(updateDataAPI, 10e3);

            // auction start date
            var val = startTime.toLocaleString('en-gb', { // 24h clock
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            $('.auction-start').text(val);

        })
        .fail(function(jqxhr, textStatus, error) {
            var
                err = textStatus + ', ' + error;
            console.error('Request Failed: ', err);
        });
}

function
searchFor(arr, key, term) {
    for (vari = 0; i < arr.length; i++) {
        if (arr[i] && arr[i][key] && arr[i][key].toLowerCase().indexOf(term.toLowerCase()) >= 0) {
            return
            arr[i];
        }
    }
}

function
updateData(data) {
    var
        fundsRaisedData = [];
    if (data.histogram && data.histogram.bin_cumulative_sum) {
        data
            .histogram
            .bin_cumulative_sum
            .forEach(function(bin, i) {
                if (i >= data.histogram.timestamped_bins.length) return;
                fundsRaisedData.push({
                    x: new Date(data.histogram.timestamped_bins[i] * 1000),
                    y: bin / wei
                });
            });
    }
    if (!fundsRaisedData.length) {
        fundsRaisedData = [{
            x: startTime,
            y: 0
        }, {
            x: new Date(),
            y: 0
        }];
    } else
    if (fundsRaisedData[0].x > startTime) {
        fundsRaisedData.unshift({
            x: startTime,
            y: 0
        }, {
            x: new Date(fundsRaisedData[0].x.getTime() - 1),
            y: 0
        });
    }

    var
        target = searchFor(chartData.datasets, 'label', 'Offered').data,
        i, auction_stage = data.status['auction_stage'] || 2;

    // verticalLine
    var
        nowX = new Date(Math.max(Date.now(), fundsRaisedData[fundsRaisedData.length - 1].x.getTime(), startTime.getTime()));
    if (auction_stage >= 3 || Math.abs(nowX.getTime() - data.status['timestamp'] * 1e3) > 600e3) { // 10min deviation
        nowX = fundsRaisedData[fundsRaisedData.length - 1].x;
    }
    //var nowX = new Date(fundsRaisedData[fundsRaisedData.length - 1].x);

    var
        nowY = fundsRaisedData[fundsRaisedData.length - 1].y;

    // change min y values to 1k after price goes above 5k
    var
        ticksMin = searchFor(chart.config.options.scales.yAxes, 'id', 'funding').ticks.min;
    if (nowY > 5e3 && ticksMin < 10) {
        searchFor(chart.config.options.scales.yAxes, 'id', 'funding').ticks.min *= 1e3;
        searchFor(chart.config.options.scales.yAxes, 'id', 'price').ticks.min *= 1e3;
    } else
    if (nowY < 0.998) {
        for (i = 1; i < target.length && 1.0 < target[i].y; i++)
        ;
        if (i >= target.length) {
            i = target.length - 1;
        }
        endTime = target[i].x;
    }

    // maxTime will be the point of target with value nowY
    for (i = 1; i < target.length && nowY < target[i].y; i++)
    ;
    if (i >= target.length) {
        i = target.length - 1;
    }

    var
        slope = (target[i].y - target[i - 1].y) / (target[i].x.getTime() - target[i - 1].x.getTime()); // dy/dx == delta
    maxTime = new Date((nowY - target[i - 1].y) / slope + target[i - 1].x.getTime());
    if (isNaN(maxTime.getTime())) {
        maxTime = endTime;
    }

    // targetValue is the value of fundingTarget on nowX
    var
        targetValue, statusTargetValue = data.status['price'] * totalIssued / wei;
    if (auction_stage >= 3) {
        maxTime = nowX;
        targetValue = nowY;
    } else
    if (nowX.getTime() >= maxTime.getTime()) {
        nowX = maxTime;
        targetValue = nowY;
    } else {
        targetValue = getCurrentPriceAt(nowX) * totalIssued;
        var
            contractPrice = getPrice(data.status.price_start, data.status.price_constant, data.status.price_exponent, (nowX.getTime() - startTime.getTime()) / 1e3) * totalIssued / wei,
            statusTimeValue = getPrice(data.status.price_start, data.status.price_constant, data.status.price_exponent, data.status.timestamp - (startTime.getTime() / 1e3)) * totalIssued / wei;
        console.debug('targetValue relative diff =', Math.abs(statusTimeValue - statusTargetValue) / statusTargetValue, Math.abs(targetValue - contractPrice) / contractPrice);
    }

    if (maxTime < endTime) {
        target.length = i + 1;
        target[i] = {
            x: maxTime,
            y: nowY
        };
    }

    if (nowX < maxTime) {
        chart.config.vLine = [{
            x: nowX,
            color: '#FF2E63',
            top: targetValue
        }, {
            x: maxTime,
            dashed: true
        }];
    } else {
        maxTime = nowX;
        chart.config.vLine = [{
            x: maxTime,
            dashed: false
        }];
    }
    if (clicked) {
        chart
            .config
            .vLine
            .push({ x: clicked.x, color: '#7777FFBB' });
    }

    endTime = new Date(Math.min(endTime.getTime(), maxTime.getTime() + (maxTime.getTime() - startTime.getTime()) * 0.1));
    chart.config.options.scales.xAxes[0].time.max = endTime;
    if (target.length < 100 && (target[1].x.getTime() - target[0].x.getTime()) > 120e3) {
        target = getPriceCurve(startTime, endTime < maxTime ?
            endTime :
            maxTime, 60e3, data.status);
        searchFor(chartData.datasets, 'label', 'Offered').data = target;
    }

    // x-axis ticks
    var
        day = 86.4e6;
    if (endTime.getTime() - startTime.getTime() < 1 * day) {
        chart.config.options.scales.xAxes[0].time.unit = 'hour';
        chart.config.options.scales.xAxes[0].time.unitStepSize = 1;
    } else
    if (endTime.getTime() - startTime.getTime() < 2 * day) {
        chart.config.options.scales.xAxes[0].time.unit = 'hour';
        chart.config.options.scales.xAxes[0].time.unitStepSize = 4;
    } else
    if (endTime.getTime() - startTime.getTime() < 7 * day) {
        chart.config.options.scales.xAxes[0].time.unit = 'day';
        chart.config.options.scales.xAxes[0].time.unitStepSize = 1;
    } else
    if (endTime.getTime() - startTime.getTime() < 14 * day) {
        chart.config.options.scales.xAxes[0].time.unit = 'day';
        chart.config.options.scales.xAxes[0].time.unitStepSize = 2;
    }

    // horizontal dotted line on nowY
    searchFor(chartData.datasets, 'label', 'Days').data = [{
        x: startTime,
        y: nowY
    }, {
        x: endTime,
        y: nowY
    }];

    // funds raised
    if (nowX > fundsRaisedData[fundsRaisedData.length - 1].x) {
        fundsRaisedData.push({ x: nowX, y: nowY });
    }
    searchFor(chartData.datasets, 'label', 'Sent').data = fundsRaisedData;
    if (auction_stage >= 3) {
        var
            raised = (data.status['raised_eth'] / wei) || nowY;
        updateCurrentValues({ // defined in token.js
            "auction_stage": auction_stage,
            "current-target": targetValue,
            "amount-raised": raised,
            "current-end": maxTime,
            "current-total": targetValue * 2,
            "current-price": (data.status["final_price"] / wei) || (targetValue / totalIssued),
            "total-issued": totalIssued
        });
    } else {
        updateCurrentValues({ // defined in token.js
            "auction_stage": auction_stage,
            "current-target": targetValue,
            "amount-raised": nowY,
            "current-end": maxTime,
            "current-total": targetValue * 2,
            "current-price": targetValue / totalIssued,
            "total-issued": totalIssued
        });
    }
    chart.update(0);
}

function
updateDataAPI() {
    $
        .getJSON('status.json', {
            ts: '' + Date.now()
        })
        .done(function(_data) {
            data = _data;
            updateData(data);
            if (data.status.auction_stage >= 3) {
                clearInterval(pollIntervalId);
                pollIntervalId = null;
                clearInterval(updateIntervalId);
                updateIntervalId = null;
            } else
            if (!updateIntervalId) {
                updateIntervalId = setInterval(function() {
                        updateData(data);
                    },
                    1e3);
            }
        })
        .fail(function(jqxhr, textStatus, error) {
            var
                err = textStatus + ', ' + error;
            console.error('Request Failed: ', err);
        });
}

function
clearClickedVline() {
    clicked = null;
    updateData(data);
}

$(document)
    .ready(function() {
        getInitialData();
    });