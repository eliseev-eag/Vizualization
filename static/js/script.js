var items;
var timeline;
var groups;

var defaultMaxDate = new Date();
defaultMaxDate.setFullYear(defaultMaxDate.getFullYear() + 5);

const defaultMinDate = new Date(100, 0, 0);
var options = {
    align: 'center',
    minHeight: '400px',
    maxHeight: '400px',
    type: 'range',
    snap: null,
    orientation: {axis: 'both'},
    dataAttributes: ['id'],
    zoomMin: 1000 * 60 * 60 * 24 * 5,
    max: defaultMaxDate,
    min: defaultMinDate
};

$(document).ready(function () {
    $('#start_date').datetimepicker({locale: 'ru', format: 'L'});
    $('#end_date').datetimepicker({locale: 'ru', format: 'L'});

    var searchForm = $('#search');
    searchForm.submit(function () {
        search(searchForm);
        return false;
    });

    init();
});

var serializedSearchForm = null;
function search(searchForm) {

    if (searchForm.serializeArray().every(function (element) {
            return element.value == ''
        })) {
        serializedSearchForm = null;
        items.clear();
        options.min = defaultMinDate;
        options.max = defaultMaxDate;
        timeline.setOptions(options);
        timeline.moveTo(Date.now());
        timeline.on('rangechanged', HideItems);
        return;
    }

    serializedSearchForm = searchForm.serialize();
    $.ajax({
        type: searchForm.attr('method'),
        url: searchForm.attr('action'),
        data: serializedSearchForm,
    })
        .done(function (data) {
            timeline.off('rangechanged', HideItems);
            items.clear();
            var min_date = new Date(data['min_date']);
            min_date.setFullYear(min_date.getFullYear() - 5);
            var max_date = new Date(data['max_date']);
            max_date.setFullYear(max_date.getFullYear() + 5);
            options.min = min_date;
            options.max = max_date;
            timeline.setOptions(options);
            var result = convertToDistObject(data['events']);
            timeline.moveTo(data['min_date']);
            items.update(result);
        });
}

function init() {
    var classes = ['blue', 'red', 'purple', 'yellow', 'green'];

    $.ajax({
        type: 'GET',
        url: 'event_types',
    })
        .done(function (eventTypes) {
            var groupsItemsArray = eventTypes.map(function (eventTypesItem) {
                var groupItem = {};
                groupItem.id = eventTypesItem;
                groupItem.content = eventTypesItem;
                groupItem.class = classes[Math.floor(Math.random() * classes.length)];
                groupItem.visible = true;
                return groupItem;
            });
            initializeChart(groupsItemsArray)
        });
}

function initializeChart(groupsItemsArray) {
    var container = document.getElementById('graph');


    items = new vis.DataSet();
    groups = new vis.DataSet(groupsItemsArray);
    timeline = new vis.Timeline(container, items, groups, options);


    timeline.on('mouseOver', function (environments) {
        FillFullnameForm(items.get(environments.item), environments.pageX, environments.pageY,
            function () {
                return environments.what != 'item';
            });
    });
    timeline.on('rangechanged', UploadEventsAjax);
    timeline.on('rangechanged', UploadAndHideNestedEvents);
    timeline.on('rangechanged', HideItems);
}
function HideItems(environments) {
    hideSmallItems(environments.end, environments.start);
}
function hideSmallItems(end, start) {
    var visibleItemsIndexes = timeline.getVisibleItems();
    visibleItemsIndexes.forEach(function (visibleItemIndex) {
        var visibleItem = items.get(visibleItemIndex);
        var timeline_length = end - start;
        if (visibleItem.duration < timeline_length * 0.008) {
            var t = items.remove(visibleItem);
        }
    });
}

var isUploadingNestedNow = false;
var nested_env;
function UploadAndHideNestedEvents(environments) {
    nested_env = environments;
    if (isUploadingNestedNow) {
        return;
    }

    var visibleItemsIndexes = timeline.getVisibleItems();
    visibleItemsIndexes.forEach(function (visibleItemIndex) {
        var visibleItem = items.get(visibleItemIndex);
        var timeline_length = environments.end - environments.start;

        if (!visibleItem || visibleItem.nested === null) return;

        if (visibleItem.duration < timeline_length * 0.15 && visibleItem.type == 'background') {
            items.remove(visibleItem.nested);
            visibleItem.nested = [];
            visibleItem.type = 'range';
            items.update(visibleItem);
            return;
        }

        if ((visibleItem.nested == undefined || !visibleItem.nested.length) && visibleItem.duration > timeline_length * 0.2) {
            var saved_environments = environments;
            isUploadingNestedNow = true;
            uploadNestedEventsAjax(visibleItem.id)
                .then(function (rows) {
                    if (rows.length > 0) {
                        visibleItem.nested = rows.map(function (rowsItem) {
                            return rowsItem.id;
                        });
                        visibleItem.type = 'background';
                        items.update(rows);
                    }
                    else {
                        visibleItem.nested = null;
                    }
                    items.update(visibleItem);
                    isUploadingNestedNow = false;
                });

            setTimeout(function () {
                if (saved_environments != nested_env)
                    UploadAndHideNestedEvents(nested_env);
            }, 800);
        }
    });
}

var isUploadingEventsNow = false;
var env;
var saved_env;

function UploadEventsAjax(environments) {
    env = environments;
    if (isUploadingEventsNow) {
        return;
    }

    isUploadingEventsNow = true;
    saved_env = environments;
    var timelineLength = saved_env.end - saved_env.start;
    var dateTime = extractTimelineLenght(timelineLength);
    var offsetEndDate = dateTime.offsetEndDate;
    var offsetStartDate = dateTime.offsetStartDate;

    uploadEventsAjax(offsetStartDate.toISOString().slice(0, 10), offsetEndDate.toISOString().slice(0, 10))
        .then(function (rows) {
            items.update(rows);
            isUploadingEventsNow = false;
        });

}


function uploadEventsAjax(start_date, end_date) {
    return new Promise(function (resolve, reject) {
        var requestType = 'GET';
        var requestData = null;

        if (serializedSearchForm != null) {
            requestType = 'POST';
            requestData = serializedSearchForm;
        }

        $.ajax({
            type: requestType,
            url: 'events/' + start_date + '/' + end_date + '/',
            data: requestData
        })
            .done(function (data) {
                var result = convertToDistObject(data['events']);
                resolve(result);
            })
            .fail(function (data) {
                reject(data);
            })
    })
}

function uploadNestedEventsAjax(parent_event_id) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            type: 'GET',
            url: 'nested_events/' + parent_event_id,
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

function extractTimelineLenght(timelineLength) {
    var offsetEndDate = new Date(saved_env.end.getTime() + timelineLength * 0.2);
    var offsetStartDate = new Date(saved_env.start.getTime() - timelineLength * 0.2);
    if (offsetStartDate < options.min)
        offsetStartDate = options.min;
    if (offsetEndDate > options.max)
        offsetEndDate = options.max;
    return {offsetEndDate: offsetEndDate, offsetStartDate: offsetStartDate};
}

function convertToDistObject(items) {
    items.forEach(function (item) {
        item.content = item.name;
        item.start = item.start_date;
        item.end = item.end_date;
        item.duration = (new Date(item.end_date) - new Date(item.start_date));
        item.group = item.event_type;
        var groupItem = groups.get(item.group);
        if (groupItem)
            item.className = groupItem.class;
    });
    return items;
}