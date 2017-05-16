/*var history_set = [
 [, 'Битва за Ленинград', new Date(1941, 7, 10), new Date(1944, 8, 9)],
 [, 'Битва за Москву', new Date(1941, 9, 30), new Date(1942, 04, 20)],
 [, 'Сталинградская битва', new Date(1942, 7, 17), new Date(1943, 02, 2)],
 [, 'Ржевская битва', new Date(1942, 1, 8), new Date(1943, 03, 31)],
 [, 'Битва за Кавказ', new Date(1942, 7, 25), new Date(1943, 10, 9)]
 ];*/

var dataTable;
var chart;
var options = {
    timeline: {showRowLabels: false},
};

function setChartHeight(rowsCount) {
    var paddingHeight = 45;
    var rowHeight = (dataTable.getNumberOfRows() + 1) * 25;
    var chartHeight = rowHeight + paddingHeight;
    options.height = chartHeight;
}

function create_chart() {
    google.charts.load("current", {packages: ["timeline"]});

    google.charts.setOnLoadCallback(function () {
            initializeChart();
        }
    );
}

function initializeChart() {
    var container = document.getElementById('graph');
    chart = new google.visualization.Timeline(container);
    dataTable = new google.visualization.DataTable();
    dataTable.addColumn({type: 'string', id: 'Term'});
    dataTable.addColumn({type: 'string', id: 'Name'});
    dataTable.addColumn({type: 'date', id: 'Start'});
    dataTable.addColumn({type: 'date', id: 'End'});

    get_events('1901-01-01', '1999-12-12')
        .then(function () {
            dataTable.addRows(rows);

            setChartHeight();
            chart.draw(dataTable, options);
        });
}

function add_rows(rows) {
    dataTable.addRows(rows);
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
                rows = [];
                resolve(convertToGoogleChartArrayValue(data['events']));
            })
            .fail(function (data) {
                reject(data);
            })
    })
}

function convertToGoogleChartArrayValue(items) {
    items.forEach(function (item) {
        row = [];
        row.push('');
        row.push(item['name']);
        row.push(new Date(item['start_date']));
        row.push(new Date(item['end_date']));
        rows.push(row);
    });
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
                rows = [];
                convertToGoogleChartArrayValue(data['events']);
                add_rows(rows)
            });
    });
}
