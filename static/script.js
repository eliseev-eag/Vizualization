/*
 function setChartHeight(rowsCount) {
 var paddingHeight = 50;
 var rowHeight = (dataTable.getNumberOfRows()) * 41;
 var chartHeight = rowHeight + paddingHeight;
 options.height = chartHeight;
 }*/

/*
 function selectHandler() {
 var selectedItem = chart.getSelection()[0];
 var isFirstDraw = true;
 if (selectedItem) {
 var value = dataTable.getValue(selectedItem.row, 0);
 $.ajax({
 type: 'GET',
 url: 'nested_events/' + value,
 })
 .done(function (data) {
 if (data['events'].length == 0) return;

 $("#graph").fadeOut({
 duration: "slow",
 start: function () {
 dataTable.removeRows(0, dataTable.getNumberOfRows());
 var rows = convertToDistObject(data['events']);
 dataTable.addRows(rows);
 elements = elements.concat(rows);
 setChartHeight();
 }
 });

 $("#graph").fadeIn({
 duration: "slow",
 step: function () {
 if (isFirstDraw) {
 chart.draw(dataTable, options);
 isFirstDraw = false;
 }
 }
 });
 });
 }
 }*/

/*function add_rows(rows) {
 dataTable.addRows(rows);
 elements = elements.concat(rows);
 setChartHeight();
 chart.draw(dataTable, options);
 }*/

window.onload = function () {
    initializeChart();
}

//date to string toISOString.slice(0,10);
function initializeChart() {
    var container = document.getElementById('graph');
    get_events('1901-01-01', '1999-12-12')
        .then(function (rows) {
            var items = new vis.DataSet(rows);
            var options = {
                align: 'center',
                //orientation:{axis:'bottom',item:'top'},
                //maxMinorChars:5
                type: 'range'
            };

            var timeline = new vis.Timeline(container, items, options);
            // add event listener

            var fullname = document.getElementById('fullname');
            var eventname = document.getElementById('eventname');
            var spanWithStartDate = document.getElementById('start');
            var spanWithEndDate = document.getElementById('end');

            timeline.on('mouseOver', function (environments) {
                if (environments.what == 'item') {
                    var selectedEvent = items.get(environments.item);
                    eventname.innerHTML = selectedEvent.content;
                    spanWithStartDate.innerHTML = convertDateToRusStandart(selectedEvent.start);
                    spanWithEndDate.innerHTML = convertDateToRusStandart(selectedEvent.end);

                    fullname.style.left = environments.pageX + 'px';
                    fullname.style.top = environments.pageY + 'px';
                    if ($(fullname).width() + environments.pageX > $(window).width())
                        fullname.style.left = $(window).width() - $(fullname).width() - 10 + 'px';
                    fullname.style.display = 'block';
                }
                else
                    fullname.style.display = 'none';
            });

        });
}

function convertDateToRusStandart(date) {
    var splittedDate = date.split('-');
    return splittedDate[2] + '.' + splittedDate[1] + '.' + splittedDate[0];
}

function get_events(start_date, end_date) {
    return new Promise(function (resolve, reject) {
        $.ajax({ // Отправляем запрос
            type: 'GET',
            url: 'events/' + start_date + '/' + end_date + '/',
        })
            .done(function (data) {
                var result = convertToDistObject(data['events'])
                resolve(result);
            })
            .fail(function (data) {
                reject(data);
            })
    })
}

function convertToDistObject(items) {
    var rows = [];
    items.forEach(function (item) {
        var row = {};
        row.item = item.id;
        row.content = item.name;
        row.start = item.start_date;
        row.end = item.end_date;
        row.className = 'red';
        rows.push(row);
    });
    return rows;
}