var items;
var timeline;
var groups;

window.onload = function () {
    initializeChart();
    var searchForm = $('#search');
    searchForm.submit(function () {
        search(searchForm);
        return false;
    });
};

function search(searchForm) {
    $.ajax({
        type: searchForm.attr('method'),
        url: searchForm.attr('action'),
        data: searchForm.serialize(),
    })
        .done(function (data) {
            items.clear();
            var result = convertToDistObject(data['events'])
            items.update(result);
        })
        .fail(function (data) {
            console.log(data);
            items.clear();
        });
}

function initializeChart() {
    var container = document.getElementById('graph');
    items = new vis.DataSet();

    var options = {
        align: 'center',
        minHeight: '400px',
        maxHeight: '400px',
        type: 'range',
        orientation: {axis: 'both'},
        dataAttributes: ['id'],
        snap: null,
        zoomMin: 1000 * 60 * 60 * 24 * 5,
        max: Date.now(),
        min: new Date(100, 0, 0)
    };

    var classes = ['blue', 'red', 'purple', 'yellow', 'green'];

    $.ajax({
        type: 'GET',
        url: 'event_types',
    })
        .done(function (eventTypes) {
            var dropdown_menu = $('.dropdown-menu');
            var groupsItemsArray = eventTypes.map(function (eventTypesItem) {
                var groupItem = {};
                groupItem.id = eventTypesItem;
                groupItem.content = eventTypesItem;
                groupItem.class = classes[Math.floor(Math.random() * classes.length)];
                groupItem.visible = true;
                return groupItem;
            });


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
            timeline.on('rangechanged', HideSmallItems);
        })
}

function HideSmallItems(environments) {
    var visibleItemsIndexes = timeline.getVisibleItems();
    visibleItemsIndexes.forEach(function (visibleItemIndex) {
        var visibleItem = items.get(visibleItemIndex);
        var timeline_length = environments.end - environments.start;
        if (visibleItem.duration < timeline_length * 0.03) {
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
    var saved_environments = environments;
    setTimeout(function () {
        if (saved_environments != nested_env)
            this(saved_environments);

    }, 800);

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
        }
    });
}
var isUploadingEventsNow = false;
var env;
function UploadEventsAjax(environments) {
    env = environments;
    if (isUploadingEventsNow) {
        return;
    }
    var saved_environments = env;
    var timelineLength = saved_environments.end - saved_environments.start;
    var offsetEndDate = new Date(saved_environments.end.getTime() + timelineLength * 0.2);
    var offsetStartDate = new Date(saved_environments.start.getTime() - timelineLength * 0.2);
    isUploadingEventsNow = true;
    uploadEventsAjax(offsetStartDate.toISOString().slice(0, 10), offsetEndDate.toISOString().slice(0, 10))
        .then(function (rows) {
            items.update(rows);
            isUploadingEventsNow = false;
        })
        .catch(function (onRejection) {
            isUploadingEventsNow = false;
        });
    setTimeout(function () {
        if (env != saved_environments)
            UploadEventsAjax(env);
    }, 800);
}

function uploadEventsAjax(start_date, end_date) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            type: 'POST',
            url: 'events/' + start_date + '/' + end_date + '/',
            data: $('#search').serialize()
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