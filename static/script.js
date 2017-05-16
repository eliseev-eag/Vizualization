var dataTable;
var chart;
var options = {
    timeline: {showRowLabels: false},
};
var elements = [];

function setChartHeight(rowsCount) {
    var paddingHeight = 50;
    var rowHeight = (dataTable.getNumberOfRows()) * 41;
    var chartHeight = rowHeight + paddingHeight;
    options.height = chartHeight;
}

function create_chart() {
    google.charts.load("current", {packages: ["timeline"]});
    google.charts.setOnLoadCallback(function () {
            initializeChart(function () {
                get_events('1901-01-01', '1999-12-12')
                    .then(function (rows) {
                        dataTable.addRows(rows);
                        elements = elements.concat(rows);
                        setChartHeight();
                        chart.draw(dataTable, options);
                    });
            });
        }
    );
}

function initializeChart(callback) {
    var container = document.getElementById('graph');
    chart = new google.visualization.Timeline(container);
    dataTable = new google.visualization.DataTable();
    dataTable.addColumn({type: 'string', id: 'Term'});
    dataTable.addColumn({type: 'string', id: 'Name'});
    dataTable.addColumn({type: 'date', id: 'Start'});
    dataTable.addColumn({type: 'date', id: 'End'});

    google.visualization.events.addListener(chart, 'select', selectHandler);

    callback();
}

function selectHandler() {
    var selectedItem = chart.getSelection()[0];
    if (selectedItem) {
        var value = dataTable.getValue(selectedItem.row, 0);
        $("#graph").fadeOut("slow");
        $("#graph").fadeIn(
            {
                duration: "slow",
                start: function () {
                    initializeChart(function () {
                        $.ajax({
                            type: 'GET',
                            url: 'nested_events/' + value,
                        })
                            .done(function (data) {
                                var rows = convertToGoogleChartArrayValue(data['events']);
                                dataTable.addRows(rows);
                                elements = elements.concat(rows);
                                setChartHeight();
                                chart.draw(dataTable, options);
                            })
                    });
                }
            });
    }
}

function add_rows(rows) {
    dataTable.addRows(rows);
    elements = elements.concat(rows);
    setChartHeight();
    chart.draw(dataTable, options);
}

function get_events(start_date, end_date) {
    return new Promise(function (resolve, reject) {
        $.ajax({ // Отправляем запрос
            type: 'GET',
            url: 'events/' + start_date + '/' + end_date + '/',
        })
            .done(function (data) {
                var result = convertToGoogleChartArrayValue(data['events'])
                resolve(result);
            })
            .fail(function (data) {
                reject(data);
            })
    })
}

function convertToGoogleChartArrayValue(items) {
    var rows = [];
    items.forEach(function (item) {
        var row = [];
        row.push(item['id'].toString());
        row.push(item['name']);
        row.push(new Date(item['start_date']));
        row.push(new Date(item['end_date']));
        rows.push(row);
    });
    return rows;
}

window.onload = function () {
    create_chart();
    /*
     $(".plus-btn").click(() => {
     $("#graph").fadeOut("slow");
     $("#graph").fadeIn(
     {
     duration: "slow",
     start: () => initializeChart([
     [, 'Немецкие танки подошли к Сталинграду', new Date(1942, 8, 23), new Date(1942, 8, 23)],
     [, 'ЕГор, пожалуйста, извлеки вложенность событий, похоже это будет боль', new Date(1942, 8, 23), new Date(1943, 2, 2)],
     [, 'Уничтожение армии Паулюса', new Date(1943, 2, 2), new Date(1943, 2, 2)]
     ])
     });});

     $(window).resize(() => {
     // $('#graph').width($(window).width());
     // $('#graph').height($(window).height() - 50);
     initializeChart(history_set);
     });*/

    $(".minus-btn").click(function () {
        $.ajax({ // Отправляем запрос
            type: "GET",
            url: "events/1715-01-01/1899-05-10/",
        })
            .done(function (data) {
                var rows = convertToGoogleChartArrayValue(data['events']);
                add_rows(rows)
            });
    });
}
